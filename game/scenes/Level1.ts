import { Scene } from 'phaser';

export class Level1 extends Scene {
    private ball!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private keyA!: Phaser.Input.Keyboard.Key;
    private keyD!: Phaser.Input.Keyboard.Key;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private background!: Phaser.GameObjects.TileSprite;
    private powerups!: Phaser.Physics.Arcade.Group;
    private flameEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
    
    // Add boost tracking
    private boostsRemaining: number = 3;
    private hasUnlimitedBoosts: boolean = false;
    private unlimitedBoostsTimer?: Phaser.Time.TimerEvent;
    private isGrounded: boolean = false;
    private lastGroundedState: boolean = false;
    private unlimitedBoostEndTime: number = 0;

    // Add new properties
    private isGameOver: boolean = false;
    private gameOverScreen?: Phaser.GameObjects.Container;
    private gameOverText?: Phaser.GameObjects.Text;
    private portal!: Phaser.GameObjects.Sprite;

    constructor() {
        super({ key: 'Level1' });
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

    create() {
        // Set up world bounds (much wider than screen)
        this.physics.world.setBounds(0, 0, 6400, 600);

        // Create scrolling background
        this.background = this.add.tileSprite(0, 0, 800, 600, 'platform')
          .setOrigin(0, 0)
          .setAlpha(0.1);

        // Initialize powerups group first
        this.powerups = this.physics.add.staticGroup();

        // Create platforms group
        this.platforms = this.physics.add.staticGroup();

        // Create platforms and powerups
        this.createPlatforms();

        // Initialize ball with physics
        this.ball = this.physics.add.sprite(100, 300, 'ball');
        const physicsRadius = 15;
        this.ball.setCircle(physicsRadius);
        this.ball.setCollideWorldBounds(true);
        this.ball.setBounce(0.2);
        this.ball.setDragX(300);
        this.ball.setMaxVelocity(400, 600);

        // Turn off debug rendering
        this.physics.world.defaults.debugShowBody = false;
        this.physics.world.defaults.debugShowStaticBody = false;

        // Set up collisions
        this.physics.add.collider(this.ball, this.platforms, () => {
          this.isGrounded = true;
          this.boostsRemaining = 3;
          this.updateBoostUI();
        });
        this.physics.add.overlap(this.ball, this.powerups, this.collectPowerup, undefined, this);

        // Set up camera to follow ball
        this.cameras.main.startFollow(this.ball, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, 6400, 600);

        // Set up ALL keyboard controls in one place
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey('A');
        this.keyD = this.input.keyboard.addKey('D');
        const spaceKey = this.input.keyboard.addKey('SPACE');
        spaceKey.on('down', this.boostBall, this);

        // Add UI for boost count
        this.createBoostUI();

        // Add temporary test portal near start
        this.createPortal(200, 300);
    }

    private createPlatforms() {
        const SECTION_WIDTH = 800;
        const LEVEL_LENGTH = 6400;
        
        // Create alternating sections
        for (let section = 0; section < 8; section++) {
          const sectionStart = section * SECTION_WIDTH;
          
          if (section % 2 === 0) {
            this.createSolidSection(sectionStart);
          } else {
            this.createPlatformSection(sectionStart);
          }
        }
    }

    private createSolidSection(startX: number) {
        // Create a series of platforms close together
        const platformHeight = 200;
        for (let x = startX + 100; x < startX + 700; x += 180) {
          this.platforms.create(x, platformHeight, 'platform');
          this.platforms.create(x + 90, platformHeight + 150, 'platform');
        }
    }

    private createPlatformSection(startX: number) {
        // Create scattered platforms for challenging jumps
        const platformPositions = [
          { x: startX + 200, y: 400 },
          { x: startX + 400, y: 300 },
          { x: startX + 600, y: 350 },
          { x: startX + 700, y: 250 }
        ];

        platformPositions.forEach(pos => {
          this.platforms.create(pos.x, pos.y, 'platform');
        });

        // Add some powerups in this section
        this.createPowerupsInSection(startX);
    }

    private createPowerupsInSection(startX: number) {
        // Add 2-3 powerups in challenging positions
        const powerupPositions = [
          { x: startX + 300, y: 200 },
          { x: startX + 500, y: 250 },
          { x: startX + 700, y: 150 }
        ];

        powerupPositions.forEach(pos => {
          const powerup = this.powerups.create(pos.x, pos.y, 'powerup');
          
          this.tweens.add({
            targets: powerup,
            y: pos.y + 20,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
          });
        });
    }

    private createBoostUI() {
        const boostText = this.add.text(16, 16, 'Boosts: 3', {
          fontSize: '18px',
          color: '#ffffff'
        });
        boostText.setScrollFactor(0);
        
        this.registry.set('boostText', boostText);
        this.updateBoostUI();
    }

    private updateBoostUI() {
        const boostText = this.registry.get('boostText') as Phaser.GameObjects.Text;
        if (this.hasUnlimitedBoosts) {
          boostText.setText('Boosts: ∞');
          boostText.setColor('#ffaa00');
        } else {
          boostText.setText(`Boosts: ${this.boostsRemaining}`);
          boostText.setColor('#ffffff');
        }
    }

    update() {
        // Check for death first
        if (this.ball.y > 580 && !this.isGameOver) {
            this.isGameOver = true;
            this.showGameOverScreen();
            return;
        }

        // Check for restart
        if (this.isGameOver) {
            if (this.input.keyboard.addKey('R').isDown) {
                // Clean up game over text
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

    private boostBall() {
        if (!this.hasUnlimitedBoosts && this.boostsRemaining <= 0) return;

        const boostPower = -300;
        this.ball.setVelocityY(this.ball.body.velocity.y + boostPower);
        
        if (!this.hasUnlimitedBoosts) {
          this.boostsRemaining--;
          this.updateBoostUI();
        }

        this.createBoostEffect();
    }

    private createBoostEffect() {
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

    private collectPowerup(ball: Phaser.Physics.Arcade.Sprite, powerup: Phaser.Physics.Arcade.Sprite) {
        if (powerup && powerup.active) {
          powerup.destroy();
          this.giveUnlimitedBoosts();
        }
    }

    private giveUnlimitedBoosts() {
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

        const powerupText = this.add.text(this.ball.x, this.ball.y - 50, 'UNLIMITED BOOSTS!', {
          fontSize: '24px',
          color: '#ffaa00'
        });
        
        this.tweens.add({
          targets: powerupText,
          y: powerupText.y - 50,
          alpha: 0,
          duration: 1000,
          ease: 'Power2',
          onComplete: () => powerupText.destroy()
        });
    }

    private endUnlimitedBoosts() {
        this.hasUnlimitedBoosts = false;
        this.boostsRemaining = 3;
        this.updateBoostUI();
        this.unlimitedBoostEndTime = 0;
        
        if (this.flameEmitter) {
          this.flameEmitter.destroy();
          this.flameEmitter = undefined;
        }
    }

    private createFlameEffect() {
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

    private updateBackground() {
        this.background.tilePositionX = this.cameras.main.scrollX * 0.6;
    }

    private showGameOverScreen() {
        this.gameOverText = this.add.text(400, 300, 'GAME OVER\nPress R to Restart', {
            fontSize: '32px',
            color: '#ff0000',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0);

        this.ball.setVelocity(0, 0);
        this.ball.setAcceleration(0, 0);
    }

    private createPortal(x: number, y: number) {
        // Create simple portal effect
        const portalGraphics = this.add.graphics();
        portalGraphics.lineStyle(2, 0x00ffff);
        portalGraphics.fillStyle(0x00ffff, 0.3);
        portalGraphics.beginPath();
        portalGraphics.arc(16, 16, 16, 0, Math.PI * 2);
        portalGraphics.strokePath();
        portalGraphics.fillPath();
        portalGraphics.generateTexture('portal', 32, 32);
        portalGraphics.destroy();

        // Create portal as a static physics sprite
        this.portal = this.physics.add.staticSprite(x, y, 'portal');
        
        // Add glow effect
        this.tweens.add({
            targets: this.portal,
            alpha: 0.7,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });

        // Add collision check
        this.physics.add.overlap(this.ball, this.portal, () => {
            this.scene.start('Level2');
        });
    }
} 