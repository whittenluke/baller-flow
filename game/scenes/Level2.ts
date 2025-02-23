import { BaseLevel } from './BaseLevel';
import Phaser from 'phaser';
import MatterJS from 'matter-js';

export class Level2 extends BaseLevel {
    private curve!: Phaser.Curves.Path;
    private rampGraphics!: Phaser.GameObjects.Graphics;
    private rampPoints: Phaser.Math.Vector2[] = [];

    constructor() {
        super('Level2');
    }

    protected initialize(): void {
        // Initialize ball
        this.createBall(200, 100);

        // Create portal
        this.createPortal(300, 300, 'Level3');
    }

    protected createLevelPlatforms(): void {
        this.createSmoothRamp();
    }

    protected createLevelPowerups(): void {
        const powerupIndices = [32, 64, 96];
        powerupIndices.forEach(index => {
            if (this.rampPoints[index]) {
                const powerup = this.matter.add.sprite(
                    this.rampPoints[index].x,
                    this.rampPoints[index].y - 30,
                    'powerup',
                    undefined,
                    BaseLevel.POWERUP_CONFIG
                );
                this.powerups.push(powerup);
                
                this.tweens.add({
                    targets: powerup,
                    y: this.rampPoints[index].y - 50,
                    duration: 1500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.inOut'
                });
            }
        });
    }

    private createSmoothRamp(): void {
        // Create flat starting platform
        const startPlatform = this.matter.bodies.rectangle(
            100, 150, 200, 16,
            {
                ...BaseLevel.PLATFORM_CONFIG,
                isStatic: true,
                label: 'platform'
            }
        ) as MatterJS.Body;
        this.matter.world.add(startPlatform);
        this.platforms.push(startPlatform);

        // Create ramp points
        this.rampPoints = [];
        const startX = 200;
        const startY = 150;
        
        for (let i = 0; i <= 20; i++) {
            const t = i / 20;
            const x = startX + (1100 * t);
            const y = startY + (200 * t * t);
            this.rampPoints.push(new Phaser.Math.Vector2(x, y));
        }

        // Draw ramp visuals
        this.createRampVisuals();
        this.createRampSegments();
    }

    private createRampVisuals(): void {
        this.rampGraphics = this.add.graphics();
        this.rampGraphics.lineStyle(16, 0x7700ff, 1);
        this.rampGraphics.lineTo(0, this.rampPoints[0].y);
        this.rampGraphics.lineTo(this.rampPoints[0].x, this.rampPoints[0].y);
        this.rampGraphics.beginPath();
        this.rampGraphics.moveTo(this.rampPoints[0].x, this.rampPoints[0].y);
        this.rampPoints.forEach(point => {
            this.rampGraphics.lineTo(point.x, point.y);
        });
        this.rampGraphics.strokePath();
    }

    private createRampSegments(): void {
        for (let i = 0; i < this.rampPoints.length - 1; i++) {
            const current = this.rampPoints[i];
            const next = this.rampPoints[i + 1];
            
            const segment = this.matter.bodies.rectangle(
                (current.x + next.x) / 2,
                (current.y + next.y) / 2,
                Phaser.Math.Distance.Between(current.x, current.y, next.x, next.y),
                8,
                {
                    ...BaseLevel.PLATFORM_CONFIG,
                    angle: Math.atan2(next.y - current.y, next.x - current.x)
                }
            ) as MatterJS.Body;
            
            this.matter.world.add(segment);
            this.platforms.push(segment);
        }
    }

    protected createPortal(x: number, y: number, nextLevel: string): Phaser.Physics.Matter.Sprite {
        const portal = this.matter.add.sprite(x, y, 'portal', undefined, BaseLevel.PORTAL_CONFIG) as Phaser.Physics.Matter.Sprite;
        
        this.tweens.add({
            targets: portal,
            alpha: 0.7,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });

        // Set up portal collision
        this.matter.world.on('collisionstart', (event: MatterJS.IEventCollision<MatterJS.Engine>) => {
            event.pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;
                if ((bodyA.label === 'ball' && bodyB.label === 'portal') ||
                    (bodyB.label === 'ball' && bodyA.label === 'portal')) {
                    this.scene.start(nextLevel);
                }
            });
        });

        return portal;
    }
} 