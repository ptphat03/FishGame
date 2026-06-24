import { FishEntity } from '../entities/FishEntity'
import { BulletEntity } from '../entities/BulletEntity'
import type { Fish } from '../../types'

export interface GameSceneOptions {
  canvas: HTMLCanvasElement
  fishList: Fish[]
  roomRtp: number                                           // RTP phòng dạng decimal (0.0–1.0)
  seatId: number                                            // Ghế ngồi (0–3), 2/3 sẽ bị lật
  onHitFish?: (fishId: number, instanceId: string) => void // đạn chạm cá → gửi lên server
  onScore?: (points: number) => void
  onShot?: (x: number, y: number, angle: number) => boolean // trả false → không bắn đạn
}

export interface SpawnFishPayload {
  instance_id: string;
  fish_id: number;
  path_id: number;
  spawn_time: number;
  duration: number;
}

// Hàm chuyển đổi toạ độ World ↔ Screen (export cho FishEntity/BulletEntity dùng)
export type CoordTransformer = (wx: number, wy: number) => { x: number; y: number }

interface Particle {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
  color: string; size: number
}

interface Bubble {
  x: number; y: number; r: number
  vy: number; wobble: number; freq: number; t: number
}

interface SeatState {
  active: boolean
  cannonAngle: number
}

interface BroadcastShootPayload {
  seat_id: number
  x: number
  y: number
  angle: number
}

export class GameScene {
  private ctx: CanvasRenderingContext2D
  private canvas: HTMLCanvasElement
  private options: GameSceneOptions
  private fishEntities: FishEntity[] = []
  private bullets: BulletEntity[] = []
  private particles: Particle[] = []
  private bubbles: Bubble[] = []

  private mouseX = 0
  private mouseY = 0
  private cannonAngle = -Math.PI / 2
  private isDisposed = false
  private animFrame = 0
  private lastTime = 0
  private bgTime = 0

  // ── Hero View ──────────────────────────────────────────────────────────────
  private seatId: number
  private seatStates = new Map<number, SeatState>()

  constructor(options: GameSceneOptions) {
    this.options = options
    this.canvas = options.canvas
    this.seatId = options.seatId

    const ctx = options.canvas.getContext('2d')
    if (!ctx) throw new Error('Cannot get 2D context')
    this.ctx = ctx

    this.resize()
    this.initBubbles()
    this.setupEvents()
    this.setSeatAngle(this.seatId, this.cannonAngle)
    this.loop(performance.now())
  }

  // ── Coordinate Transformers ─────────────────────────────────────────────────

  /** Chuyển đổi toạ độ World → Screen. Do Canvas đã dùng CSS rotate(180deg) nên không cần flip tại đây nữa. */
  worldToScreen = (worldX: number, worldY: number): { x: number; y: number } => {
    const w = this.canvas.width
    const h = this.canvas.height
    
    if (this.seatId === 1) { // Top
      return { x: w - worldX, y: h - worldY }
    } else if (this.seatId === 2) { // Left
      return { 
        x: worldY * (w / h), 
        y: h - worldX * (h / w) 
      }
    } else if (this.seatId === 3) { // Right
      return { 
        x: w - worldY * (w / h), 
        y: worldX * (h / w) 
      }
    }
    return { x: worldX, y: worldY }
  }

  screenToWorld = (screenX: number, screenY: number): { x: number; y: number } => {
    const w = this.canvas.width
    const h = this.canvas.height

    if (this.seatId === 1) {
      return { x: w - screenX, y: h - screenY }
    } else if (this.seatId === 2) {
      return {
        x: (h - screenY) * (w / h),
        y: screenX * (h / w)
      }
    } else if (this.seatId === 3) {
      return {
        x: screenY * (w / h),
        y: (w - screenX) * (h / w)
      }
    }
    return { x: screenX, y: screenY }
  }

  // ── Setup ─────────────────────────────────────────────────────────────────

  private resize() {
    const parent = this.canvas.parentElement
    const rect = parent?.getBoundingClientRect()
    this.canvas.width = rect?.width ?? window.innerWidth
    this.canvas.height = rect?.height ?? window.innerHeight
  }

  private initBubbles() {
    const { width: w, height: h } = this.canvas
    for (let i = 0; i < 28; i++) {
      this.bubbles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 2 + Math.random() * 6,
        vy: 18 + Math.random() * 28,
        wobble: Math.random() * Math.PI * 2,
        freq: 0.4 + Math.random() * 1.4,
        t: Math.random() * 100,
      })
    }
  }

  private absoluteAngleToLocal(angle: number): number {
    const w = this.canvas.width
    const h = this.canvas.height
    
    const vx = Math.cos(angle)
    const vy = Math.sin(angle)
    
    let lx = vx
    let ly = vy

    if (this.seatId === 1) {
      lx = -vx; ly = -vy
    } else if (this.seatId === 2) {
      lx = vy * (w / h)
      ly = -vx * (h / w)
    } else if (this.seatId === 3) {
      lx = -vy * (w / h)
      ly = vx * (h / w)
    }
    
    return Math.atan2(ly, lx)
  }

  private getAbsoluteSeatOrigin(seatId: number, w: number, h: number): { x: number; y: number } {
    switch (seatId) {
      case 0: return { x: w / 2, y: h } // Bottom
      case 1: return { x: w / 2, y: 0 } // Top
      case 2: return { x: 0, y: h / 2 } // Left
      case 3: return { x: w, y: h / 2 } // Right
      default: return { x: w / 2, y: h }
    }
  }

  private setSeatAngle(seatId: number, angle: number) {
    this.seatStates.set(seatId, { active: true, cannonAngle: angle })
  }

  public handleRemoteShoot(payload: BroadcastShootPayload) {
    if (payload.seat_id === this.seatId) {
      return
    }
    const origin = this.getAbsoluteSeatOrigin(payload.seat_id, this.canvas.width, this.canvas.height)
    this.setSeatAngle(payload.seat_id, payload.angle)
    this.bullets.push(new BulletEntity(origin.x, origin.y, payload.x, payload.y))
  }

  addFishFromServer(payload: SpawnFishPayload) {
    console.log('[GameScene] addFishFromServer called with', payload)
    // 1. Tìm cấu hình cá trong fishList
    const fishData = this.options.fishList.find(f => f.id === payload.fish_id);
    if (!fishData) return; // Nếu không có cấu hình thì không vẽ

    // 2. Tính toán RTP (giống logic cũ)
    const rtp = this.options.roomRtp > 0 && this.options.roomRtp <= 1 ? this.options.roomRtp : 0.90
    const killProb = fishData.base_prob * rtp

    // 3. Khởi tạo cá (Truyền thêm payload vào để Entity biết đường bơi)
    const fish = new FishEntity(
      fishData,
      this.canvas.width,
      this.canvas.height,
      payload,     // Truyền thẳng payload thay vì index
      killProb
    )
    this.fishEntities.push(fish)
  }

  // Gọi khi server xác nhận cá đã chết (hit_result.killed = true)
  confirmFishDeath(instanceId: string) {
    const fish = this.fishEntities.find((f) => f.instanceId === instanceId)
    if (!fish || fish.isDead) return

    this.spawnParticles(fish.x, fish.y, fish.size)
    this.options.onScore?.(10)
    fish.confirmDeath()

    // Xoá con cá đã chết khỏi mảng (Không tự sinh thêm cá mới nữa)
    setTimeout(() => {
      if (this.isDisposed) return
      this.fishEntities = this.fishEntities.filter(f => f.instanceId !== instanceId)
    }, 600)
  }

  private spawnParticles(cx: number, cy: number, radius: number) {
    const colors = ['#fbbf24', '#f59e0b', '#ef4444', '#fb923c', '#fff', '#fde68a']
    const count = 18 + Math.round(radius * 0.6)
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6
      const speed = 90 + Math.random() * 210
      this.particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.45,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 5,
      })
    }
  }

  // ── Events ────────────────────────────────────────────────────────────────

  private setupEvents() {
    this.canvas.addEventListener('mousemove', this.onMouseMove)
    this.canvas.addEventListener('click', this.onClick)
    window.addEventListener('resize', this.onResize)
  }

  private onMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top

    // Lưu screenX/Y cho crosshair (vẽ ở vị trí chuột thực tế)
    this.mouseX = screenX
    this.mouseY = screenY

    // Chuyển sang World Space để tính cannon angle
    const world = this.screenToWorld(screenX, screenY)
    const absOrigin = this.getAbsoluteSeatOrigin(this.seatId, this.canvas.width, this.canvas.height)
    this.cannonAngle = Math.atan2(world.y - absOrigin.y, world.x - absOrigin.x)
    this.setSeatAngle(this.seatId, this.cannonAngle)
  }

  private onClick = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top

    // Chuyển sang World Space
    const world = this.screenToWorld(screenX, screenY)
    const origin = this.getAbsoluteSeatOrigin(this.seatId, this.canvas.width, this.canvas.height)
    const allowed = this.options.onShot?.(world.x, world.y, this.cannonAngle) ?? true
    if (allowed) {
      this.bullets.push(new BulletEntity(origin.x, origin.y, world.x, world.y))
    }
  }

  private onResize = () => {
    this.resize()
  }
  removeFish(instanceId: string) {
    this.fishEntities = this.fishEntities.filter(f => f.instanceId !== instanceId);
  }

  public clearBoard() {
    this.fishEntities = []
    this.bullets = []
    this.particles = []
  }
  // ── Game loop ─────────────────────────────────────────────────────────────

  private loop = (now: number) => {
    if (this.isDisposed) return
    const dt = Math.min((now - this.lastTime) / 1000, 0.1)
    this.lastTime = now
    this.bgTime += dt

    this.update(dt)
    this.draw()
    this.animFrame = requestAnimationFrame(this.loop)
  }

  private update(dt: number) {
    const { width: w, height: h } = this.canvas

    this.fishEntities = this.fishEntities.filter(fish => !fish.isExpired());

    for (const fish of this.fishEntities) { fish.update(dt, w, h) }

    for (const b of this.bullets) b.update(dt)
    this.bullets = this.bullets.filter((b) => !b.isDead)

    for (const p of this.particles) {
      p.life += dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 180 * dt
    }
    this.particles = this.particles.filter((p) => p.life < p.maxLife)

    for (const b of this.bubbles) {
      b.t += dt
      b.y -= b.vy * dt
      b.x += Math.sin(b.t * b.freq) * 0.6
      if (b.y < -15) { b.y = h + 10; b.x = Math.random() * w }
    }

    // Collision: đạn chạm cá → flash effect + gửi server, không tự quyết định death
    for (const bullet of this.bullets) {
      if (bullet.isDead) continue
      for (const fish of this.fishEntities) {
        if (fish.isDead) continue
        const dx = bullet.x - fish.x
        const dy = bullet.y - fish.y
        if (Math.sqrt(dx * dx + dy * dy) < fish.size * 0.88) {
          fish.takeDamage(10)     // visual flash effect
          bullet.destroy()
          this.options.onHitFish?.(fish.fishData.id, fish.instanceId) // server quyết định kill
          break
        }
      }
    }

  }

  // ── Drawing ───────────────────────────────────────────────────────────────

  private draw() {
    const ctx = this.ctx
    const { width: w, height: h } = this.canvas

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, h)
    bg.addColorStop(0, '#010d1f')
    bg.addColorStop(0.45, '#041630')
    bg.addColorStop(1, '#062040')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)

    this.drawCaustics(ctx, w, h)
    this.drawBubbles(ctx)
    this.drawSeabed(ctx, w, h)

    // Vẽ cá và đạn qua worldToScreen transformer
    for (const fish of this.fishEntities) fish.draw(ctx, this.worldToScreen, w, h)
    for (const b of this.bullets) b.draw(ctx, this.worldToScreen)

    this.drawParticles(ctx)
    this.drawCannon(ctx)
    this.drawCrosshair(ctx)
  }

  private drawCaustics(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save()
    ctx.globalAlpha = 0.035
    for (let i = 0; i < 6; i++) {
      const x = w * (i / 6) + Math.sin(this.bgTime * 0.28 + i * 1.1) * 35
      const grad = ctx.createLinearGradient(x, 0, x + 35, h * 0.65)
      grad.addColorStop(0, 'rgba(100,200,255,1)')
      grad.addColorStop(1, 'rgba(0,50,140,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + 18 + Math.sin(this.bgTime * 0.45 + i) * 12, h * 0.65)
      ctx.lineTo(x + 36, 0)
      ctx.fill()
    }
    ctx.restore()
  }

  private drawBubbles(ctx: CanvasRenderingContext2D) {
    ctx.save()
    for (const b of this.bubbles) {
      const scr = this.worldToScreen(b.x, b.y)
      ctx.globalAlpha = 0.22
      ctx.beginPath()
      ctx.arc(scr.x, scr.y, b.r, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(160,230,255,0.9)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.globalAlpha = 0.06
      ctx.fillStyle = 'rgba(160,230,255,1)'
      ctx.fill()
    }
    ctx.restore()
  }

  private drawSeabed(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Bottom
    let sand = ctx.createLinearGradient(0, h - 65, 0, h)
    sand.addColorStop(0, 'rgba(8,35,75,0)')
    sand.addColorStop(1, 'rgba(12,45,90,0.85)')
    ctx.fillStyle = sand
    ctx.fillRect(0, h - 65, w, 65)

    // Top
    sand = ctx.createLinearGradient(0, 65, 0, 0)
    sand.addColorStop(0, 'rgba(8,35,75,0)')
    sand.addColorStop(1, 'rgba(12,45,90,0.85)')
    ctx.fillStyle = sand
    ctx.fillRect(0, 0, w, 65)

    // Left
    sand = ctx.createLinearGradient(65, 0, 0, 0)
    sand.addColorStop(0, 'rgba(8,35,75,0)')
    sand.addColorStop(1, 'rgba(12,45,90,0.85)')
    ctx.fillStyle = sand
    ctx.fillRect(0, 0, 65, h)

    // Right
    sand = ctx.createLinearGradient(w - 65, 0, w, 0)
    sand.addColorStop(0, 'rgba(8,35,75,0)')
    sand.addColorStop(1, 'rgba(12,45,90,0.85)')
    ctx.fillStyle = sand
    ctx.fillRect(w - 65, 0, 65, h)

    const positions = [0.06, 0.18, 0.42, 0.68, 0.82, 0.94]
    for (const p of positions) this.drawSeaweed(ctx, w * p, h, 1)
    for (const p of positions) this.drawSeaweed(ctx, w * p, 0, -1)
  }

  private drawSeaweed(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number) {
    ctx.save()
    ctx.strokeStyle = 'rgba(22,101,52,0.55)'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    const segs = 5 + Math.floor(Math.random() * 2)
    for (let i = 1; i <= segs; i++) {
      const sway = Math.sin(this.bgTime * 0.75 + x * 0.02 + i * 0.9) * 7 * (i / segs)
      ctx.lineTo(x + sway, y - i * 20 * dir)
    }
    ctx.stroke()
    ctx.restore()
  }



  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = 1 - p.life / p.maxLife
      const scr = this.worldToScreen(p.x, p.y)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.arc(scr.x, scr.y, p.size * alpha, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.fill()
      ctx.restore()
    }
  }

  private drawCannon(ctx: CanvasRenderingContext2D) {
    const w = this.canvas.width
    const h = this.canvas.height
    const barrelLen = 38
    const barrelW = 13

    const drawSingleCannon = (origin: { x: number; y: number }, angle: number, isLocal: boolean) => {
      const scr = this.worldToScreen(origin.x, origin.y)
      const cx = scr.x
      const cy = scr.y
      let drawAngle = angle

      ctx.save()
      ctx.translate(cx, cy)

      ctx.beginPath()
      ctx.arc(0, 0, 33, 0, Math.PI * 2)
      ctx.strokeStyle = isLocal
        ? `rgba(56,189,248,${0.24 + Math.sin(this.bgTime * 2) * 0.08})`
        : `rgba(192,132,252,${0.18 + Math.sin(this.bgTime * 1.5) * 0.06})`
      ctx.lineWidth = 5
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(0, 0, 27, 0, Math.PI * 2)
      const baseGrd = ctx.createRadialGradient(-4, -4, 2, 0, 0, 27)
      baseGrd.addColorStop(0, '#475569')
      baseGrd.addColorStop(1, '#1e293b')
      ctx.fillStyle = baseGrd
      ctx.fill()
      ctx.strokeStyle = isLocal ? '#38bdf8' : '#c084fc'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.rotate(drawAngle)
      const barrelGrd = ctx.createLinearGradient(0, -barrelW / 2, 0, barrelW / 2)
      barrelGrd.addColorStop(0, '#64748b')
      barrelGrd.addColorStop(0.5, '#94a3b8')
      barrelGrd.addColorStop(1, '#334155')
      ctx.fillStyle = barrelGrd
      ctx.strokeStyle = isLocal ? '#38bdf8' : '#c084fc'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.rect(2, -barrelW / 2, barrelLen, barrelW)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = isLocal ? '#38bdf8' : '#c084fc'
      ctx.fillRect(barrelLen - 2, -barrelW / 2 - 2, 8, barrelW + 4)

      ctx.restore()
      ctx.save()
      ctx.translate(cx, cy)
      ctx.beginPath()
      ctx.arc(0, 0, 8, 0, Math.PI * 2)
      ctx.fillStyle = isLocal ? '#38bdf8' : '#c084fc'
      ctx.fill()
      ctx.restore()
    }

    // Vẽ các nòng súng khác (Multiplayer)
    for (const [sId, state] of this.seatStates.entries()) {
      if (sId === this.seatId) continue
      const absOrigin = this.getAbsoluteSeatOrigin(sId, w, h)
      drawSingleCannon(absOrigin, this.absoluteAngleToLocal(state.cannonAngle), false)
    }

    // Vẽ nòng súng của bản thân
    const localAbs = this.getAbsoluteSeatOrigin(this.seatId, w, h)
    drawSingleCannon(localAbs, this.absoluteAngleToLocal(this.cannonAngle), true)
  }

  private drawCrosshair(ctx: CanvasRenderingContext2D) {
    // Crosshair luôn vẽ ở vị trí chuột thực tế (screen space)
    const { x, y } = { x: this.mouseX, y: this.mouseY }
    const arm = 11

    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(x - arm, y); ctx.lineTo(x + arm, y)
    ctx.moveTo(x, y - arm); ctx.lineTo(x, y + arm)
    ctx.stroke()

    ctx.setLineDash([])
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(251,191,36,0.85)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  dispose() {
    this.isDisposed = true
    cancelAnimationFrame(this.animFrame)
    this.canvas.removeEventListener('mousemove', this.onMouseMove)
    this.canvas.removeEventListener('click', this.onClick)
    window.removeEventListener('resize', this.onResize)
  }
}
