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
        // Create the curved ramp first
        this.createLevelPlatforms();
        
        // Create powerups along the ramp
        this.createLevelPowerups();

        // Initialize ball at the start of the ramp
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

        // Create points for the curve
        this.rampPoints = [];
        const startX = 200;
        const startY = 150;
        
        // Create the curve path
        const path = new Phaser.Curves.Path(startX, startY);
        path.quadraticBezierTo(startX + 550, startY, startX + 1100, startY + 200);
        
        // Sample points along the curve
        const points = path.getPoints(20);
        this.rampPoints = points;

        // Create physics body
        const vertices = [];
        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            const angle = Math.atan2(next.y - current.y, next.x - current.x);
            
            const segment = this.matter.bodies.rectangle(
                (current.x + next.x) / 2,
                (current.y + next.y) / 2,
                Phaser.Math.Distance.Between(current.x, current.y, next.x, next.y),
                16,
                {
                    ...BaseLevel.PLATFORM_CONFIG,
                    angle: angle
                }
            ) as MatterJS.Body;
            
            this.matter.world.add(segment);
            this.platforms.push(segment);
        }

        // Draw the visual ramp
        this.createRampVisuals();
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