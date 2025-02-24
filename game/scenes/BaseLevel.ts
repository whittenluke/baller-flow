import Phaser, { Scene, GameObjects } from 'phaser';
import MatterJS from 'matter-js';
import { LevelEditorTools } from '../editor/LevelEditorTools';

export abstract class BaseLevel extends Scene {
    protected ball!: Phaser.Physics.Matter.Sprite;
    protected cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    protected keyA!: Phaser.Input.Keyboard.Key;
    protected keyD!: Phaser.Input.Keyboard.Key;
    protected platforms!: MatterJS.Body[];
    protected background!: Phaser.GameObjects.TileSprite;
    protected powerups!: Phaser.Physics.Matter.Sprite[];
    protected flameEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
    
    protected boostsRemaining: number = 3;
    protected hasUnlimitedBoosts: boolean = false;
    protected unlimitedBoostsTimer?: Phaser.Time.TimerEvent;
    protected isGrounded: boolean = false;
    protected lastGroundedState: boolean = false;
    protected unlimitedBoostEndTime: number = 0;
    protected isGameOver: boolean = false;
    protected gameOverText?: Phaser.GameObjects.Text;

    protected static readonly BALL_CONFIG = {
        circleRadius: 15,
        friction: 0,           // No friction with surfaces
        restitution: 0,        // No bounce
        mass: 1,
        label: 'ball',
        density: 0.001,        // Lower density
        frictionAir: 0,        // No air friction
        slop: 0,              // No overlap
        inertia: Infinity     // Perfect rolling
    } as const;

    protected static readonly PLATFORM_CONFIG = {
        isStatic: true,
        label: 'platform',
        friction: 0,           // No friction on platforms
        restitution: 0,
        chamfer: { radius: 0 }
    } as const;

    protected static readonly POWERUP_CONFIG = {
        isStatic: true,
        isSensor: true,
        label: 'powerup'
    } as const;

    protected static readonly PORTAL_CONFIG = {
        isStatic: true,
        isSensor: true,
        label: 'portal'
    } as const;

    protected static readonly PHYSICS = {
        moveForce: 0.002,      // Slightly stronger movement force
        maxVelocity: 6,        // Higher max speed
        boostPower: -4
    } as const;

    constructor(key: string) {
        super({ key });
    }

    preload() {
        // Create ball texture with perfect circle and transparent background
        const radius = 16;
        const graphics = this.add.graphics();
        
        // Clear any background
        graphics.clear();
        
        // Create outer glow
        graphics.lineStyle(3, 0x9933ff, 0.4);
        graphics.beginPath();
        graphics.arc(radius, radius, radius, 0, Math.PI * 2);
        graphics.strokePath();
        
        // Main ball fill
        graphics.fillStyle(0x7700ff, 1);
        graphics.beginPath();
        graphics.arc(radius, radius, radius - 1, 0, Math.PI * 2);
        graphics.fillPath();
        
        // Inner highlight
        graphics.fillStyle(0xffffff, 0.3);
        graphics.beginPath();
        graphics.arc(radius - 4, radius - 4, 4, 0, Math.PI * 2);
        graphics.fillPath();

        // Generate the texture
        graphics.generateTexture('ball', radius * 2, radius * 2);
        graphics.destroy();

        // Create flame particle texture
        const flameGraphics = this.add.graphics();
        flameGraphics.fillStyle(0xff7700, 1);
        flameGraphics.beginPath();
        flameGraphics.arc(4, 4, 4, 0, Math.PI * 2);
        flameGraphics.fillPath();
        flameGraphics.closePath();
        flameGraphics.generateTexture('flame', 8, 8);
        flameGraphics.destroy();

        // Create platform texture
        const platformGraphics = this.add.graphics();
        platformGraphics.fillStyle(0x444444);
        platformGraphics.fillRect(0, 0, 200, 32);
        platformGraphics.lineStyle(2, 0x7700ff);
        platformGraphics.strokeRect(0, 0, 200, 32);
        platformGraphics.generateTexture('platform', 200, 32);
        platformGraphics.destroy();

        // Create powerup texture
        const powerupGraphics = this.add.graphics();
        powerupGraphics.lineStyle(2, 0xffaa00);
        powerupGraphics.fillStyle(0xff7700, 1);
        powerupGraphics.beginPath();
        powerupGraphics.arc(8, 8, 8, 0, Math.PI * 2);
        powerupGraphics.strokePath();
        powerupGraphics.fillPath();
        
        // Add flame symbol inside
        powerupGraphics.lineStyle(1, 0xffff00);
        powerupGraphics.moveTo(8, 4);
        powerupGraphics.lineTo(8, 12);
        powerupGraphics.moveTo(5, 8);
        powerupGraphics.lineTo(11, 8);
        
        powerupGraphics.generateTexture('powerup', 16, 16);
        powerupGraphics.destroy();
    }

    protected createBoostUI(): void {
        const boostText = this.add.text(16, 16, 'Boosts: 3', {
            fontSize: '18px',
            color: '#ffffff'
        });
        boostText.setScrollFactor(0);
        this.registry.set('boostText', boostText);
        this.updateBoostUI();
    }

    protected updateBoostUI(): void {
        const boostText = this.registry.get('boostText') as Phaser.GameObjects.Text;
        if (!boostText) return;

        if (this.hasUnlimitedBoosts) {
            boostText.setText('Boosts: ∞');
            boostText.setColor('#ffaa00');
        } else {
            boostText.setText(`Boosts: ${this.boostsRemaining}`);
            boostText.setColor('#ffffff');
        }
    }

    protected setupPowerupCollection(): void {
        if (!this.registry.get('boostText')) {
            this.createBoostUI();
        }

        this.matter.world.on('collisionstart', (event: MatterJS.IEventCollision<MatterJS.Engine>) => {
            event.pairs.forEach((pair) => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;
                
                // Check if collision involves ball and powerup
                if ((bodyA === this.ball.body && bodyB.label === 'powerup') ||
                    (bodyB === this.ball.body && bodyA.label === 'powerup')) {
                    const powerupBody = bodyA.label === 'powerup' ? bodyA : bodyB;
                    const powerupSprite = this.powerups.find(p => p.body === powerupBody);
                    
                    if (powerupSprite && powerupSprite.active) {
                        this.tweens.killTweensOf(powerupSprite);
                        powerupSprite.destroy();
                        this.giveUnlimitedBoosts();
                    }
                }

                // Check for ground collision to reset boosts
                if ((bodyA === this.ball.body && bodyB.label === 'platform') ||
                    (bodyB === this.ball.body && bodyA.label === 'platform')) {
                    this.isGrounded = true;
                    this.boostsRemaining = 3;
                    this.updateBoostUI();
                }
            });
        });
    }

    protected giveUnlimitedBoosts(): void {
        this.hasUnlimitedBoosts = true;
        this.updateBoostUI();

        if (this.flameEmitter) {
            this.flameEmitter.destroy();
            this.flameEmitter = undefined;
        }

        this.createFlameEffect();

        if (this.unlimitedBoostsTimer) {
            this.unlimitedBoostsTimer.destroy();
        }

        const now = this.time.now;
        this.unlimitedBoostEndTime = Math.max(this.unlimitedBoostEndTime, now) + 10000;

        this.unlimitedBoostsTimer = this.time.delayedCall(
            this.unlimitedBoostEndTime - now,
            this.endUnlimitedBoosts,
            undefined,
            this
        );

        const powerupText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 100,
            'UNLIMITED BOOSTS!',
            {
                fontSize: '24px',
                color: '#ffaa00'
            }
        ).setOrigin(0.5).setScrollFactor(0);
        
        this.tweens.add({
            targets: powerupText,
            y: powerupText.y - 50,
            alpha: { from: 1, to: 0 },
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                powerupText.destroy();
            }
        });
    }

    protected endUnlimitedBoosts(): void {
        this.hasUnlimitedBoosts = false;
        this.boostsRemaining = 3;
        this.updateBoostUI();
        this.unlimitedBoostEndTime = 0;
        
        if (this.flameEmitter) {
            this.flameEmitter.destroy();
            this.flameEmitter = undefined;
        }
    }

    protected createFlameEffect(): void {
        this.flameEmitter = this.add.particles(0, 0, 'flame', {
            speed: { min: 50, max: 100 },
            scale: { start: 1, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: { min: 200, max: 400 },
            blendMode: 'ADD',
            quantity: 1,
            frequency: 20,
            angle: { min: -150, max: -30 },
            tint: [0xff7700, 0xffaa00, 0xff0000],
            emitZone: {
                type: 'edge',
                source: new Phaser.Geom.Circle(0, 0, 16),
                quantity: 32
            }
        });

        this.flameEmitter.startFollow(this.ball);
    }

    protected boostBall(): void {
        if (!this.hasUnlimitedBoosts && this.boostsRemaining <= 0) return;
        if (!this.ball?.body) return;

        this.ball.setVelocityY(BaseLevel.PHYSICS.boostPower);
        
        if (!this.hasUnlimitedBoosts) {
            this.boostsRemaining--;
            this.updateBoostUI();
        }

        this.createBoostEffect();
    }

    protected createBoostEffect(): void {
        const particles = this.add.particles(0, 0, 'flame', {
            speed: { min: 50, max: 100 },
            scale: { start: 1, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: { min: 200, max: 400 },
            blendMode: 'ADD',
            quantity: 1,
            frequency: 20,
            angle: { min: -150, max: -30 },
            tint: [0xff7700, 0xffaa00, 0xff0000],
            emitZone: {
                type: 'edge',
                source: new Phaser.Geom.Circle(0, 0, 16),
                quantity: 32
            }
        });

        particles.startFollow(this.ball);
        this.time.delayedCall(150, () => particles.destroy());
    }

    public update() {
        if (!this.ball) return;
        
        // Check for death first
        if (this.ball.y > 580 && !this.isGameOver) {
            this.isGameOver = true;
            this.showGameOverScreen();
            return;
        }

        // Check for restart
        if (this.isGameOver) {
            if (this.input?.keyboard) {
                const key = this.input.keyboard.addKey('R');
                if (key?.isDown) {
                    if (this.gameOverText) {
                        this.gameOverText.destroy();
                    }
                    this.isGameOver = false;
                    this.scene.restart();
                    return;
                }
            }
            return;
        }

        // Normal movement only if not game over
        if (!this.isGameOver && this.ball.body) {
            if (this.input?.keyboard) {
                // Get current velocity
                const currentVelocity = this.ball.body.velocity;

                if (this.cursors.left.isDown || this.keyA?.isDown) {
                    // Only apply force if we're under max speed
                    if (currentVelocity.x > -BaseLevel.PHYSICS.maxVelocity) {
                        this.ball.applyForce(new Phaser.Math.Vector2(-BaseLevel.PHYSICS.moveForce, 0));
                    }
                } else if (this.cursors.right.isDown || this.keyD?.isDown) {
                    // Only apply force if we're under max speed
                    if (currentVelocity.x < BaseLevel.PHYSICS.maxVelocity) {
                        this.ball.applyForce(new Phaser.Math.Vector2(BaseLevel.PHYSICS.moveForce, 0));
                    }
                }
            }
        }

        this.updateBackground();
    }

    protected updateBackground(): void {
        this.background.tilePositionX = this.cameras.main.scrollX * 0.6;
    }

    protected showGameOverScreen(): void {
        this.gameOverText = this.add.text(400, 300, 'GAME OVER\nPress R to Restart', {
            fontSize: '32px',
            color: '#ff0000',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0);

        if (!this.ball) return;
        this.ball.setVelocity(0, 0);
        this.ball.setAngularVelocity(0);
    }

    protected createBackground(tint?: number): void {
        this.background = this.add.tileSprite(0, 0, 800, 600, 'platform')
            .setOrigin(0, 0)
            .setAlpha(0.1);
        if (tint) {
            this.background.setTint(tint);
        }
    }

    protected createPortal(x: number, y: number, nextLevel: string): Phaser.Physics.Matter.Sprite {
        const portal = this.matter.add.sprite(x, y, 'portal', undefined, BaseLevel.PORTAL_CONFIG);
        
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

    protected setupControls(): void {
        if (this.input?.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keyA = this.input.keyboard.addKey('A');
            this.keyD = this.input.keyboard.addKey('D');
            const spaceKey = this.input.keyboard.addKey('SPACE');
            spaceKey?.on('down', () => this.boostBall());
        }
    }

    protected createBall(x: number, y: number): Phaser.Physics.Matter.Sprite {
        this.ball = this.matter.add.sprite(x, y, 'ball', undefined, BaseLevel.BALL_CONFIG);
        
        // Set up camera to follow ball
        this.cameras.main.startFollow(this.ball, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, 6400, 600);
        
        return this.ball;
    }

    protected setupUI() {
        // Implementation of UI setup
    }

    protected abstract initialize(): void;

    public create() {
        // Set up world bounds
        this.matter.world.setBounds(0, 0, 6400, 600);

        // Initialize arrays
        this.platforms = [];
        this.powerups = [];

        // Create background
        this.createBackground();

        // Let the specific level initialize its content
        this.initialize();

        // Set up controls and UI
        this.setupControls();
        this.setupPowerupCollection();
        this.createBoostUI();
    }
} 