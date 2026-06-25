import { FishEntity } from '../entities/FishEntity'
import { BulletEntity } from '../entities/BulletEntity'
import type { Fish } from '../../types'

export interface GameSceneOptions {
  canvas: HTMLCanvasElement
  fishList: Fish[]
  roomRtp: number                                          
  seatId: number                                           
  onHitFish?: (fishId: number, instanceId: string) => void
  onScore?: (points: number) => void
  onShot?: (x: number, y: number, angle: number) => boolean
}

export interface SpawnFishPayload {
  instance_id: string;
  fish_id: number;
  path_id: number;
  spawn_time: number;
  duration: number;
}

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
  
  private localBetAmount: number = 10

  public setLocalBet(amount: number) {
    this.localBetAmount = amount
  }

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


  
  worldToScreen = (worldX: number, worldY: number): { x: number; y: number } => {
    const w = this.canvas.width
    const h = this.canvas.height
    
    if (this.seatId === 2 || this.seatId === 3) {
      return { x: w - worldX, y: h - worldY }
    }
    return { x: worldX, y: worldY }
  }

  screenToWorld = (screenX: number, screenY: number): { x: number; y: number } => {
    const w = this.canvas.width
    const h = this.canvas.height

    if (this.seatId === 2 || this.seatId === 3) {
      return { x: w - screenX, y: h - screenY }
    }
    return { x: screenX, y: screenY }
  }


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
        r: 1.5 + Math.random() * 3,
        vy: 20 + Math.random() * 40,
        wobble: Math.random() * Math.PI * 2,
        freq: 0.1 + Math.random() * 0.3,
        t: Math.random() * 100,
      })
    }
  }

  private absoluteAngleToLocal(angle: number): number {
    if (this.seatId === 2 || this.seatId === 3) {
      const vx = Math.cos(angle)
      const vy = Math.sin(angle)
      return Math.atan2(-vy, -vx)
    }
    return angle
  }

  private getAbsoluteSeatOrigin(seatId: number, w: number, h: number): { x: number; y: number } {
    const padX = 124;
    const padY = 72;
    switch (seatId) {
      case 0: return { x: padX, y: h - padY }
      case 1: return { x: w - padX, y: h - padY }
      case 2: return { x: padX, y: padY }
      case 3: return { x: w - padX, y: padY }
      default: return { x: padX, y: h - padY }
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
    const fishData = this.options.fishList.find(f => f.id === payload.fish_id);
    if (!fishData) return;

    const rtp = this.options.roomRtp > 0 && this.options.roomRtp <= 1 ? this.options.roomRtp : 0.90
    const killProb = fishData.base_prob * rtp

    const fish = new FishEntity(
      fishData,
      this.canvas.width,
      this.canvas.height,
      payload,    
      killProb
    )
    this.fishEntities.push(fish)
  }

  confirmFishDeath(instanceId: string) {
    const fish = this.fishEntities.find((f) => f.instanceId === instanceId)
    if (!fish || fish.isDead) return

    this.spawnParticles(fish.x, fish.y, fish.size)
    this.options.onScore?.(10)
    fish.confirmDeath()

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


  private setupEvents() {
    this.canvas.addEventListener('mousemove', this.onMouseMove)
    this.canvas.addEventListener('click', this.onClick)
    window.addEventListener('resize', this.onResize)
  }

  private onMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top

    this.mouseX = screenX
    this.mouseY = screenY

    const world = this.screenToWorld(screenX, screenY)
    const absOrigin = this.getAbsoluteSeatOrigin(this.seatId, this.canvas.width, this.canvas.height)
    this.cannonAngle = Math.atan2(world.y - absOrigin.y, world.x - absOrigin.x)
    this.setSeatAngle(this.seatId, this.cannonAngle)
  }

  private onClick = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top

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
    for (const bullet of this.bullets) {
      if (bullet.isDead) continue
      for (const fish of this.fishEntities) {
        if (fish.isDead) continue
        const dx = bullet.x - fish.x
        const dy = bullet.y - fish.y
        if (Math.sqrt(dx * dx + dy * dy) < fish.getCollisionRadius()) {
          fish.takeDamage(10)    
          bullet.destroy()
          this.options.onHitFish?.(fish.fishData.id, fish.instanceId)
          break
        }
      }
    }
  }


  private draw() {
    const ctx = this.ctx
    const { width: w, height: h } = this.canvas

    const bg = ctx.createLinearGradient(0, 0, 0, h)
    bg.addColorStop(0, '#050a15')
    bg.addColorStop(1, '#0a192f')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)

    this.drawCyberGrid(ctx, w, h)
    this.drawBubbles(ctx)

    for (const fish of this.fishEntities) fish.draw(ctx, this.worldToScreen, w, h)
    for (const b of this.bullets) b.draw(ctx, this.worldToScreen)

    this.drawParticles(ctx)
    this.drawCannon(ctx)
    this.drawCrosshair(ctx)
  }

  private drawCyberGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save()
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.12)'
    ctx.lineWidth = 1
    
    const cols = 24
    const rows = 12
    const cellW = w / cols
    
    ctx.beginPath()
    for (let i = 0; i <= cols; i++) {
      ctx.moveTo(i * cellW, 0)
      ctx.lineTo(i * cellW, h)
    }
    const scrollOffset = (this.bgTime * 15) % (h / rows)
    for (let i = -1; i <= rows + 1; i++) {
      const y = i * (h / rows) + scrollOffset
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
    }
    ctx.stroke()

    ctx.globalAlpha = 0.04
    ctx.fillStyle = '#22d3ee'
    for (let i = 0; i < 4; i++) {
      const cx = (w * 0.25 * i) + Math.sin(this.bgTime * 0.5 + i) * 50
      const cy = h * 0.5 + Math.cos(this.bgTime * 0.3 + i) * 100
      ctx.beginPath()
      ctx.arc(cx, cy, 180, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  private drawBubbles(ctx: CanvasRenderingContext2D) {
    ctx.save()
    for (const b of this.bubbles) {
      const scr = this.worldToScreen(b.x, b.y)
      ctx.globalAlpha = 0.6
      ctx.beginPath()
      ctx.rect(scr.x - b.r, scr.y - b.r, b.r * 2, b.r * 2)
      ctx.fillStyle = 'rgba(34, 211, 238, 0.8)'
      ctx.shadowColor = '#22d3ee'
      ctx.shadowBlur = 4
      ctx.fill()
    }
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

    const drawSingleCannon = (origin: { x: number; y: number }, angle: number, isLocal: boolean) => {
      const scr = this.worldToScreen(origin.x, origin.y)
      const cx = scr.x
      const cy = scr.y

      ctx.save()
      ctx.translate(cx, cy)

      const primaryColor = isLocal ? '#22d3ee' : '#f87171'
      const darkColor = isLocal ? '#0f172a' : '#450a0a'
      
      ctx.shadowColor = primaryColor
      ctx.shadowBlur = 15

      ctx.beginPath()
      for(let i=0; i<6; i++) {
        const a = (Math.PI / 3) * i + (Math.PI / 6)
        ctx.lineTo(38 * Math.cos(a), 38 * Math.sin(a))
      }
      ctx.closePath()
      ctx.fillStyle = darkColor
      ctx.fill()
      ctx.strokeStyle = primaryColor
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.shadowBlur = 0

      ctx.save()
      ctx.rotate(angle)
      
      ctx.beginPath()
      ctx.rect(0, -16, 52, 32)
      ctx.fillStyle = '#1e293b'
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      ctx.rect(12, -10, 48, 5)
      ctx.rect(12, 5, 48, 5)
      ctx.fillStyle = primaryColor
      ctx.shadowBlur = 10
      ctx.fill()

      ctx.restore()

      ctx.shadowBlur = 0
      ctx.beginPath()
      ctx.arc(0, 0, 16, 0, Math.PI * 2)
      ctx.fillStyle = '#020617'
      ctx.fill()
      
      ctx.beginPath()
      ctx.arc(0, 0, 8, 0, Math.PI * 2)
      ctx.fillStyle = primaryColor
      ctx.shadowBlur = 20
      ctx.fill()

      if (isLocal) {
        ctx.shadowBlur = 0
        ctx.font = '900 13px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(this.localBetAmount.toString(), 0, 26)
      }

      ctx.restore()
    }

    for (const [sId, state] of this.seatStates.entries()) {
      if (sId === this.seatId) continue
      const absOrigin = this.getAbsoluteSeatOrigin(sId, w, h)
      drawSingleCannon(absOrigin, this.absoluteAngleToLocal(state.cannonAngle), false)
    }

    const localAbs = this.getAbsoluteSeatOrigin(this.seatId, w, h)
    drawSingleCannon(localAbs, this.absoluteAngleToLocal(this.cannonAngle), true)
  }

  private drawCrosshair(ctx: CanvasRenderingContext2D) {
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


  dispose() {
    this.isDisposed = true
    cancelAnimationFrame(this.animFrame)
    this.canvas.removeEventListener('mousemove', this.onMouseMove)
    this.canvas.removeEventListener('click', this.onClick)
    window.removeEventListener('resize', this.onResize)
  }
}
