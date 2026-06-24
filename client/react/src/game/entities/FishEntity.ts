import type { Fish } from '../../types'
import { SpawnFishPayload, CoordTransformer } from '../scenes/GameScene'

const PALETTE = [
  { body: '#22d3ee', shade: '#0891b2' },
  { body: '#fb923c', shade: '#c2410c' },
  { body: '#a78bfa', shade: '#6d28d9' },
  { body: '#4ade80', shade: '#15803d' },
  { body: '#f472b6', shade: '#be185d' },
  { body: '#fbbf24', shade: '#b45309' },
  { body: '#f87171', shade: '#b91c1c' },
]

export class FishEntity {
  public x: number = 0
  public y: number = 0
  public isDead = false
  public readonly instanceId: string
  public readonly killProb: number   // xác suất kill mỗi lần bắn trúng (đã nhân RTP)
  public isFlashing = false
  private flashTimer = 0
  private shakeX = 0                // rung lắc khi bị trúng
  private shakeY = 0
  public readonly fishData: Fish
  public direction: number = 1;
  private baseY: number = 0;

  private speed: number
  private color: { body: string; shade: string }
  readonly size: number

  private payload: SpawnFishPayload
  private timeAlive: number = 0

  constructor(fishData: Fish, canvasW: number, canvasH: number, payload: SpawnFishPayload, killProb: number) {
    this.fishData = fishData
    this.instanceId = payload.instance_id
    this.killProb = killProb
    this.payload = payload

    this.speed = fishData.speed * 55 + 25
    // Lấy màu sắc dựa trên ID của cá để mỗi loại cá có 1 màu cố định
    // Dùng chia lấy dư (%) phòng trường hợp số loại cá nhiều hơn số màu trong PALETTE
    const ci = (fishData.id - 1) % PALETTE.length
    this.color = PALETTE[Math.max(0, ci)]

    // size grows with health (log scale), clamped 20-55
    this.size = Math.min(55, Math.max(20, 18 + Math.log(fishData.health + 1) * 9))
    this.initPath();

    // Tính toán timeAlive ban đầu (nếu cá được server sinh ra từ trước)
    const now = Date.now()
    this.timeAlive = Math.max(0, (now - payload.spawn_time) / 1000)
    
    // Cập nhật toạ độ ngay lập tức theo timeAlive để cá không bị reset về đầu map
    this.updatePosition(canvasW, canvasH)
  }

  private initPath() {
    // Dùng mã instanceId để tạo seed random đồng bộ giữa các client (0.0 -> 1.0)
    let seed = 0;
    for (let i = 0; i < this.instanceId.length; i++) {
      seed = (seed + this.instanceId.charCodeAt(i)) % 100;
    }
    const syncRand = seed / 100;

    // Phân tán cá dọc theo trục Y một chút để không bị dính chùm vào nhau (±30% màn hình)
    this.baseY = (syncRand - 0.5) * 0.6;
  }

  private getPositionAtTime(t: number, canvasW: number, canvasH: number): { x: number; y: number } {
    let x = 0, y = 0;
    
    const dist = this.speed * t;
    const dx = dist * (canvasW / Math.sqrt(canvasW*canvasW + canvasH*canvasH));
    const dy = dist * (canvasH / Math.sqrt(canvasW*canvasW + canvasH*canvasH));
    
    const offsetY = this.baseY * canvasH;

    switch (this.payload.path_id) {
      case 1: // Bay xéo từ trên-trái xuống dưới-phải
        x = -80 + dx;
        y = offsetY - 80 + dy;
        break;
      case 2: // Bay xéo từ dưới-trái lên trên-phải
        x = -80 + dx;
        y = canvasH + 80 + offsetY - dy;
        break;
      case 3: // Bay xéo từ trên-phải xuống dưới-trái
        x = canvasW + 80 - dx;
        y = offsetY - 80 + dy;
        break;
      case 4: // Bay xéo từ dưới-phải lên trên-trái
      default:
        x = canvasW + 80 - dx;
        y = canvasH + 80 + offsetY - dy;
        break;
    }

    return { x, y };
  }

  private updatePosition(canvasW: number, canvasH: number) {
    const pos = this.getPositionAtTime(this.timeAlive, canvasW, canvasH);
    this.x = pos.x;
    this.y = pos.y;
  }

  isExpired(): boolean {
    return this.timeAlive >= this.payload.duration;
  }

  // Bật flash + shake — không set isDead (server mới quyết định)
  takeDamage(_amount: number) {
    if (this.isDead) return
    this.isFlashing = true
    this.flashTimer = 0.20
    // rung ngẫu nhiên nhỏ
    this.shakeX = (Math.random() - 0.5) * 6
    this.shakeY = (Math.random() - 0.5) * 4
  }

  // Gọi khi server xác nhận cá đã chết
  confirmDeath() {
    if (this.isDead) return
    this.isDead = true
  }

  update(dt: number, canvasW: number, canvasH: number) {
    if (this.isDead) return
    this.timeAlive += dt

    // Cập nhật lại toạ độ theo thời gian sống hiện tại (đảm bảo đồng bộ với mọi client)
    this.updatePosition(canvasW, canvasH)

    // Flash + shake timer (Giữ nguyên)
    if (this.isFlashing) {
      this.flashTimer -= dt
      this.shakeX *= 0.7
      this.shakeY *= 0.7
      if (this.flashTimer <= 0) {
        this.isFlashing = false
        this.shakeX = 0
        this.shakeY = 0
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, worldToScreen: CoordTransformer, w: number, h: number) {
    if (this.isDead) return

    // Chuyển đổi toạ độ World → Screen
    const transform = worldToScreen ?? ((x: number, y: number) => ({ x, y }))
    const scr = transform(this.x + this.shakeX, this.y + this.shakeY)

    ctx.save()
    ctx.translate(scr.x, scr.y)

    // Flash effect: lớp trắng phủ lên cá khi bị trúng đạn
    if (this.isFlashing) {
      const alpha = (this.flashTimer / 0.20) * 0.55
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.ellipse(0, 0, this.size * 1.1, this.size * 0.65, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.restore()
    }

    // Determine local visual angle dynamically
    const dt = 0.01
    const nextPos = this.getPositionAtTime(this.timeAlive + dt, w, h)

    const scrNext = transform(nextPos.x, nextPos.y)
    const lx = scrNext.x - scr.x
    const ly = scrNext.y - scr.y
    const angle = Math.atan2(ly, lx)

    ctx.rotate(angle)

    // Lật ngược bụng cá nếu bơi ngược chiều trục X cục bộ
    if (lx < 0) ctx.scale(1, -1)

    const s = this.size
    const { body, shade } = this.color

    // Shadow
    ctx.save()
    ctx.globalAlpha = 0.15
    ctx.beginPath()
    ctx.ellipse(s * 0.1, s * 0.75, s * 0.8, s * 0.2, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()

    // Tail
    ctx.beginPath()
    ctx.moveTo(-s * 0.85, 0)
    ctx.lineTo(-s * 1.55, -s * 0.55)
    ctx.lineTo(-s * 1.55, s * 0.55)
    ctx.closePath()
    ctx.fillStyle = shade
    ctx.fill()

    // Body
    ctx.beginPath()
    ctx.ellipse(0, 0, s, s * 0.58, 0, 0, Math.PI * 2)
    ctx.fillStyle = body
    ctx.fill()

    // Belly highlight
    ctx.beginPath()
    ctx.ellipse(s * 0.08, s * 0.18, s * 0.48, s * 0.22, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.22)'
    ctx.fill()

    // Dorsal fin
    ctx.beginPath()
    ctx.moveTo(-s * 0.05, -s * 0.54)
    ctx.lineTo(s * 0.25, -s * 0.96)
    ctx.lineTo(s * 0.58, -s * 0.54)
    ctx.closePath()
    ctx.fillStyle = shade
    ctx.fill()

    // Pectoral fin
    ctx.beginPath()
    ctx.ellipse(s * 0.15, s * 0.3, s * 0.28, s * 0.13, -0.4, 0, Math.PI * 2)
    ctx.fillStyle = `${shade}cc`
    ctx.fill()

    // Eye
    ctx.beginPath()
    ctx.arc(s * 0.52, -s * 0.1, s * 0.16, 0, Math.PI * 2)
    ctx.fillStyle = '#0f172a'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(s * 0.55, -s * 0.13, s * 0.07, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()

    ctx.restore()

    // Label tỷ lệ (vẽ riêng qua transform, luôn thẳng đứng không bị ngược)
    this.drawStatsLabel(ctx, transform)
  }

  private drawStatsLabel(ctx: CanvasRenderingContext2D, worldToScreen: CoordTransformer) {
    const scrPos = worldToScreen(this.x + this.shakeX, this.y + this.shakeY - this.size - 10)
    const cx = scrPos.x
    const cy = scrPos.y

    const name = this.fishData.name
    const mult = this.fishData.reward_multiplier
    const pct = (this.killProb * 100)
    const probStr = pct < 0.1
      ? pct.toFixed(3) + '%'
      : pct < 1
        ? pct.toFixed(2) + '%'
        : pct.toFixed(1) + '%'

    // Màu xác suất: xanh → vàng → cam → đỏ tuỳ theo độ khó
    const probColor = pct > 10 ? '#4ade80'
      : pct > 1 ? '#facc15'
        : pct > 0.1 ? '#fb923c'
          : '#f87171'

    ctx.save()
    ctx.font = 'bold 11px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const nameText = name
    const multText = `×${mult}`
    const probText = probStr

    const nameW = ctx.measureText(nameText).width + 10
    const multW = ctx.measureText(multText).width + 10
    const probW = ctx.measureText(probText).width + 10

    // Khai báo các hằng số khoảng cách
    const gapX = 4    // Khoảng cách ngang giữa mult và prob
    const gapY = 4    // Khoảng cách dọc giữa 2 hàng
    const h = 16      // Chiều cao của badge
    const r = 4       // Độ bo góc

    // Tính tổng chiều rộng hàng dưới
    const bottomTotalW = multW + gapX + probW

    // Tính tọa độ X bắt đầu cho từng hàng để đảm bảo CĂN GIỮA (cx)
    const startXTop = cx - nameW / 2
    const startXBottom = cx - bottomTotalW / 2

    // Tính tọa độ Y trung tâm cho từng hàng
    const cyBottom = cy
    const cyTop = cy - h - gapY

    ctx.save()
    
    // Không cần quay chữ vì CSS canvas luôn nằm ngang và không bị lật
    ctx.translate(cx, cyTop + (h + gapY) / 2)
    ctx.translate(-cx, -(cyTop + (h + gapY) / 2))

    // ─── VẼ HÀNG TRÊN: TÊN CÁ ────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    this._roundRect(ctx, startXTop, cyTop - h / 2, nameW, h, r)
    ctx.fill()
    ctx.fillStyle = '#e2e8f0'
    ctx.fillText(nameText, startXTop + nameW / 2, cyTop)

    // ─── VẼ HÀNG DƯỚI: MULTIPLIER & PROBABILITY ──────────────────────────────

    // 1. Nền multiplier badge (Nằm bên trái)
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    this._roundRect(ctx, startXBottom, cyBottom - h / 2, multW, h, r)
    ctx.fill()
    ctx.fillStyle = '#e2e8f0'
    ctx.fillText(multText, startXBottom + multW / 2, cyBottom)

    // 2. Nền prob badge (Nằm bên phải)
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    this._roundRect(ctx, startXBottom + multW + gapX, cyBottom - h / 2, probW, h, r)
    ctx.fill()
    ctx.fillStyle = probColor
    ctx.fillText(probText, startXBottom + multW + gapX + probW / 2, cyBottom)

    ctx.restore()
  }

  private _roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.arcTo(x + w, y, x + w, y + r, r)
    ctx.lineTo(x + w, y + h - r)
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
    ctx.lineTo(x + r, y + h)
    ctx.arcTo(x, y + h, x, y + h - r, r)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
  }
}
