import type { Fish } from '../../types'
import { SpawnFishPayload, CoordTransformer } from '../scenes/GameScene'

const imageCache: Record<string, HTMLImageElement> = {}

function getImage(path: string): HTMLImageElement {
  if (!imageCache[path]) {
    const img = new Image()
    img.src = path
    imageCache[path] = img
  }
  return imageCache[path]
}

export class FishEntity {
  public x: number = 0
  public y: number = 0
  public isDead = false
  public readonly instanceId: string
  public readonly killProb: number
  public isFlashing = false
  private flashTimer = 0
  private shakeX = 0
  private shakeY = 0
  public readonly fishData: Fish
  public direction: number = 1
  private baseY: number = 0

  private speed: number
  readonly size: number

  private payload: SpawnFishPayload
  private timeAlive: number = 0

  constructor(fishData: Fish, canvasW: number, canvasH: number, payload: SpawnFishPayload, killProb: number) {
    this.fishData = fishData
    this.instanceId = payload.instance_id
    this.killProb = killProb
    this.payload = payload

    this.speed = fishData.speed * 55 + 25
    this.size = Math.min(60, Math.max(20, 18 + Math.log(fishData.health + 1) * 10))
    this.initPath()

    const now = Date.now()
    this.timeAlive = Math.max(0, (now - payload.spawn_time) / 1000)
    
    this.updatePosition(canvasW, canvasH)
  }

  private initPath() {
    let seed = 0;
    for (let i = 0; i < this.instanceId.length; i++) {
      seed = (seed + this.instanceId.charCodeAt(i)) % 100;
    }
    const syncRand = seed / 100;
    this.baseY = (syncRand - 0.5) * 0.6;
  }

  getCollisionRadius(): number {
    let typeScale = 1.0;
    if (this.fishData.name.includes('Clownfish')) typeScale = 0.8;
    else if (this.fishData.name.includes('Pufferfish')) typeScale = 1.1;
    else if (this.fishData.name.includes('Stingray')) typeScale = 1.4;
    else if (this.fishData.name.includes('Turtle')) typeScale = 1.8;
    else if (this.fishData.name.includes('Shark')) typeScale = 3.2;

    const globalSizeMultiplier = 2.0;
    const drawWidth = this.size * 1.8 * typeScale * globalSizeMultiplier;
    return drawWidth * 0.45; // slightly smaller than full width for generous hitbox
  }

  private getPositionAtTime(t: number, canvasW: number, canvasH: number): { x: number; y: number } {
    const dist = this.speed * t;
    const pathType = (this.payload.path_id - 1) % 5; // Có 5 kiểu bơi (0 đến 4)
    const isLeftToRight = (this.payload.path_id % 2 === 1);
    
    // Y cơ bản (từ 10% đến 90% chiều cao màn hình)
    const offsetY = canvasH * 0.1 + (this.baseY + 0.5) * canvasH * 0.8;
    
    let x = 0;
    let y = offsetY;

    if (isLeftToRight) {
      x = -150 + dist;
    } else {
      x = canvasW + 150 - dist;
    }

    switch (pathType) {
      case 0: 
        // Kiểu 0: Bơi ngang thẳng tắp
        break;
      case 1: 
        // Kiểu 1: Bơi lượn sóng (Sine wave)
        y = offsetY + Math.sin(t * 1.5 + this.baseY * 10) * 80;
        break;
      case 2: 
        // Kiểu 2: Bơi chéo (Diagonal)
        const slope = (this.baseY > 0) ? 0.25 : -0.25;
        y = isLeftToRight ? (offsetY + dist * slope) : (offsetY - dist * slope);
        break;
      case 3: 
        // Kiểu 3: Bơi hình Parabol (Lượn hình vòng cung lớn)
        const normalizedX = (x - canvasW / 2) / (canvasW / 2);
        const amplitude = (this.baseY > 0) ? 200 : -200;
        y = offsetY - amplitude * (1 - normalizedX * normalizedX);
        break;
      case 4: 
        // Kiểu 4: Lượn sóng gợn nhẹ và chậm
        y = offsetY + Math.cos(t * 0.8 + this.baseY * 5) * 40;
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

  takeDamage(_amount: number) {
    if (this.isDead) return
    this.isFlashing = true
    this.flashTimer = 0.20
    this.shakeX = (Math.random() - 0.5) * 6
    this.shakeY = (Math.random() - 0.5) * 4
  }

  confirmDeath() {
    if (this.isDead) return
    this.isDead = true
  }

  update(dt: number, canvasW: number, canvasH: number) {
    if (this.isDead) return
    this.timeAlive += dt
    this.updatePosition(canvasW, canvasH)

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

    const transform = worldToScreen ?? ((x: number, y: number) => ({ x, y }))
    const scr = transform(this.x + this.shakeX, this.y + this.shakeY)

    ctx.save()
    ctx.translate(scr.x, scr.y)

    const dt = 0.01
    const baseScr = transform(this.x, this.y)
    const nextPos = this.getPositionAtTime(this.timeAlive + dt, w, h)
    const scrNext = transform(nextPos.x, nextPos.y)
    
    // Tính toán góc bằng toạ độ gốc chưa rung lắc, tránh việc cá bị xoay mòng mòng khi trúng đạn
    const lx = scrNext.x - baseScr.x
    const ly = scrNext.y - baseScr.y
    const angle = Math.atan2(ly, lx)

    ctx.rotate(angle)

    // Flip vertical if moving left so the fish is never upside down
    if (lx < 0) ctx.scale(1, -1)

    let typeScale = 1.0;
    if (this.fishData.name.includes('Clownfish')) typeScale = 0.8;
    else if (this.fishData.name.includes('Pufferfish')) typeScale = 1.1;
    else if (this.fishData.name.includes('Stingray')) typeScale = 1.4;
    else if (this.fishData.name.includes('Turtle')) typeScale = 1.8;
    else if (this.fishData.name.includes('Shark')) typeScale = 3.2;

    // Phóng to tất cả các loại cá lên gấp đôi
    const globalSizeMultiplier = 2.0;
    const drawWidth = this.size * 1.8 * typeScale * globalSizeMultiplier;

    // Shadow
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.ellipse(0, drawWidth * 0.4, drawWidth * 0.5, drawWidth * 0.15, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()

    // Draw Image
    const imgPath = this.fishData.asset_path || '/assets/fish/clownfish.svg'
    const img = getImage(imgPath)
    
    if (img.complete && img.naturalWidth > 0) {
      const drawHeight = drawWidth * (img.naturalHeight / img.naturalWidth)
      
      // Draw actual fish
      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)

      // Draw white flash exactly over the fish shape
      if (this.isFlashing) {
        ctx.save()
        ctx.filter = 'brightness(0) invert(1)'
        ctx.globalAlpha = (this.flashTimer / 0.20) * 0.8
        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
        ctx.restore()
      }
    } else {
      // Fallback
      ctx.beginPath()
      ctx.ellipse(0, 0, drawWidth / 2, drawWidth / 4, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#ff0000'
      ctx.fill()
      
      if (this.isFlashing) {
        ctx.save()
        ctx.globalAlpha = (this.flashTimer / 0.20) * 0.8
        ctx.beginPath()
        ctx.ellipse(0, 0, drawWidth / 2, drawWidth / 4, 0, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        ctx.restore()
      }
    }

    ctx.restore()

  }

}
