import { CoordTransformer } from '../scenes/GameScene'

const BULLET_SPEED = 620
const BULLET_MAX_LIFE = 1.8

export class BulletEntity {
  public x: number
  public y: number
  public isDead = false

  private vx: number
  private vy: number
  private lifetime = 0
  private trail: Array<{ x: number; y: number }> = []

  constructor(startX: number, startY: number, targetX: number, targetY: number) {
    const dx = targetX - startX
    const dy = targetY - startY
    
    const ASPECT_RATIO = 16 / 9
    const du = dx / ASPECT_RATIO
    const dv = dy
    const dist = Math.sqrt(du * du + dv * dv) || 1
    
    this.x = startX
    this.y = startY
    this.vx = (du / dist) * BULLET_SPEED * ASPECT_RATIO
    this.vy = (dv / dist) * BULLET_SPEED
  }

  update(dt: number) {
    if (this.isDead) return

    this.trail.push({ x: this.x, y: this.y })
    if (this.trail.length > 7) this.trail.shift()

    this.x += this.vx * dt
    this.y += this.vy * dt
    this.lifetime += dt

    if (this.lifetime >= BULLET_MAX_LIFE) this.isDead = true
  }

  draw(ctx: CanvasRenderingContext2D, worldToScreen?: CoordTransformer) {
    if (this.isDead) return

    const transform = worldToScreen ?? ((x: number, y: number) => ({ x, y }))

    for (let i = 0; i < this.trail.length; i++) {
      const t = i / this.trail.length
      const scr = transform(this.trail[i].x, this.trail[i].y)
      ctx.beginPath()
      ctx.arc(scr.x, scr.y, 4 * t, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(34, 211, 238, ${t * 0.4})`
      ctx.fill()
    }

    const scrMain = transform(this.x, this.y)
    
    ctx.save()
    ctx.translate(scrMain.x, scrMain.y)
    
    const angle = Math.atan2(this.vy, this.vx)
    ctx.rotate(angle)

    ctx.shadowColor = '#22d3ee'
    ctx.shadowBlur = 15

    ctx.beginPath()
    ctx.ellipse(0, 0, 16, 4, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#0891b2'
    ctx.fill()

    ctx.beginPath()
    ctx.ellipse(0, 0, 8, 2, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#c0caf5'
    ctx.fill()

    ctx.restore()
  }

  destroy() {
    this.isDead = true
  }
}
