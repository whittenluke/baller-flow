import { Scene } from 'phaser';

export class BaseLevel extends Scene {
    protected ball!: Phaser.Physics.Arcade.Sprite;
    protected cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    protected keyA!: Phaser.Input.Keyboard.Key;
    protected keyD!: Phaser.Input.Keyboard.Key;
    protected platforms!: Phaser.Physics.Arcade.StaticGroup;
    protected background!: Phaser.GameObjects.TileSprite;
    protected powerups!: Phaser.Physics.Arcade.Group;
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

    protected boostBall() {
        if (!this.hasUnlimitedBoosts && this.boostsRemaining <= 0) return;

        const boostPower = -300;
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
        // Check for death
        if (this.ball.y > 580 && !this.isGameOver) {
            this.isGameOver = true;
            this.showGameOverScreen();
            return;
        }

        // Check for restart
        if (this.isGameOver) {
            if (this.input.keyboard.addKey('R').isDown) {
                if (this.gameOverText) {
                    this.gameOverText.destroy();
                }
                this.isGameOver = false;
                this.scene.restart();
                return;
            }
            return;
        }

        // Normal movement only if not game over
        if (!this.isGameOver) {
            if (this.cursors.left.isDown || this.keyA.isDown) {
                this.ball.setAccelerationX(-300);
            } else if (this.cursors.right.isDown || this.keyD.isDown) {
                this.ball.setAccelerationX(300);
            } else {
                this.ball.setAccelerationX(0);
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

        this.ball.setVelocity(0, 0);
        this.ball.setAcceleration(0, 0);
    }
} 