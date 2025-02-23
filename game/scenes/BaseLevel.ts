import Phaser, { Scene, GameObjects } from 'phaser';
import MatterJS from 'matter-js';

export class BaseLevel extends Scene {
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

    constructor(key: string) {
        super({ key });
    }

    protected createBoostUI() {
        const boostText = this.add.text(16, 16, 'Boosts: 3', {
            fontSize: '18px',
            color: '#ffffff'
        });
        boostText.setScrollFactor(0);
        this.registry.set('boostText', boostText);
        this.updateBoostUI();
    }

    protected updateBoostUI() {
        const boostText = this.registry.get('boostText') as Phaser.GameObjects.Text;
        if (this.hasUnlimitedBoosts) {
            boostText.setText('Boosts: ∞');
            boostText.setColor('#ffaa00');
        } else {
            boostText.setText(`Boosts: ${this.boostsRemaining}`);
            boostText.setColor('#ffffff');
        }
    }

    protected setupPowerupCollection() {
        // Matter.js collision handling
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
                        powerupSprite.destroy();
                        this.hasUnlimitedBoosts = true;
                        this.updateBoostUI();
                        this.time.delayedCall(5000, () => {
                            this.hasUnlimitedBoosts = false;
                            this.updateBoostUI();
                        });
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

        // Handle leaving ground
        this.matter.world.on('collisionend', (event: MatterJS.IEventCollision<MatterJS.Engine>) => {
            event.pairs.forEach((pair) => {
                if ((pair.bodyA === this.ball.body && pair.bodyB.label === 'platform') ||
                    (pair.bodyB === this.ball.body && pair.bodyA.label === 'platform')) {
                    this.isGrounded = false;
                }
            });
        });
    }

    protected boostBall() {
        if (!this.hasUnlimitedBoosts && this.boostsRemaining <= 0) return;
        if (!this.ball?.body) return;

        const boostPower = -10; // Adjusted for Matter.js physics
        this.ball.setVelocityY(this.ball.body.velocity.y + boostPower);
        
        if (!this.hasUnlimitedBoosts) {
            this.boostsRemaining--;
            this.updateBoostUI();
        }

        this.createBoostEffect();
    }

    protected createBoostEffect() {
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

    update() {
        if (!this.ball) return;

        if (this.ball.y > 580 && !this.isGameOver) {
            this.isGameOver = true;
            this.showGameOverScreen();
            return;
        }

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

        if (!this.isGameOver) {
            if (this.input?.keyboard) {
                const moveForce = 0.005; // Adjusted for Matter.js physics
                if (this.cursors.left.isDown || this.keyA?.isDown) {
                    this.ball.applyForce(new Phaser.Math.Vector2(-moveForce, 0));
                } else if (this.cursors.right.isDown || this.keyD?.isDown) {
                    this.ball.applyForce(new Phaser.Math.Vector2(moveForce, 0));
                }
            }
        }

        this.updateBackground();
    }

    protected updateBackground() {
        this.background.tilePositionX = this.cameras.main.scrollX * 0.6;
    }

    protected showGameOverScreen() {
        this.gameOverText = this.add.text(400, 300, 'GAME OVER\nPress R to Restart', {
            fontSize: '32px',
            color: '#ff0000',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0);

        if (!this.ball) return;
        this.ball.setVelocity(0, 0);
        this.ball.setAngularVelocity(0);
    }
} 