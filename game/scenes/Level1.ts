import { BaseLevel } from './BaseLevel';
import Phaser from 'phaser';
import MatterJS from 'matter-js';

export class Level1 extends BaseLevel {
    constructor() {
        super('Level1');
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
        // Set up world bounds
        this.matter.world.setBounds(0, 0, 6400, 600);

        // Initialize arrays
        this.platforms = [];
        this.powerups = [];

        // Create background
        this.background = this.add.tileSprite(0, 0, 800, 600, 'platform')
            .setOrigin(0, 0)
            .setAlpha(0.1);

        // Create platforms and powerups
        this.createPlatforms();

        // Initialize ball with Matter.js physics
        this.ball = this.matter.add.sprite(100, 300, 'ball', undefined, {
            circleRadius: 15,
            friction: 0.01,      // Lower friction for smoother rolling
            restitution: 0,      // No bounce
            mass: 1,
            label: 'ball',
            density: 0.002,
            frictionAir: 0.001,  // Lower air friction
            slop: 0,             // Prevent sinking into platforms
            chamfer: { radius: 15 } // Perfect circle collision
        });

        // Set up camera
        this.cameras.main.startFollow(this.ball, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, 6400, 600);

        // Set up controls
        if (this.input?.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keyA = this.input.keyboard.addKey('A');
            this.keyD = this.input.keyboard.addKey('D');
            const spaceKey = this.input.keyboard.addKey('SPACE');
            spaceKey?.on('down', () => this.boostBall());
        }

        // Set up powerup collection
        this.setupPowerupCollection();

        // Add UI
        this.createBoostUI();

        // Create portal to next level
        this.createPortal(6200, 300);
    }

    protected createPlatforms() {
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

    protected createSolidSection(startX: number) {
        const platformHeight = 200;
        const isFirstSection = startX === 0;
        
        // Create top platform except in first section
        if (!isFirstSection) {
            const platform = this.matter.bodies.rectangle(
                startX + 400,
                platformHeight,
                700,
                32,
                {
                    isStatic: true,
                    label: 'platform',
                    friction: 0.05,
                    restitution: 0,
                    chamfer: { radius: 0 }  // Sharp edges for flat surface
                }
            ) as MatterJS.Body;
            this.matter.world.add(platform);
            this.platforms.push(platform);
        }

        // Always create bottom platform
        const platform2 = this.matter.bodies.rectangle(
            startX + 400,
            platformHeight + 150,
            700,
            32,
            {
                isStatic: true,
                label: 'platform',
                friction: 0.05,
                restitution: 0,
                chamfer: { radius: 0 }
            }
        ) as MatterJS.Body;
        this.matter.world.add(platform2);
        this.platforms.push(platform2);
    }

    protected createPlatformSection(startX: number) {
        // Create scattered platforms for challenging jumps
        const platformPositions = [
            { x: startX + 200, y: 400 },
            { x: startX + 400, y: 300 },
            { x: startX + 600, y: 350 },
            { x: startX + 700, y: 250 }
        ];

        platformPositions.forEach(pos => {
            const platform = this.matter.bodies.rectangle(pos.x, pos.y, 200, 32, {
                isStatic: true,
                label: 'platform'
            }) as MatterJS.Body;
            this.matter.world.add(platform);
            this.platforms.push(platform);
        });

        // Add powerups in this section
        this.createPowerupsInSection(startX);
    }

    protected createPowerupsInSection(startX: number) {
        const powerupPositions = [
            { x: startX + 400, y: 200 },
            { x: startX + 600, y: 250 }
        ];

        powerupPositions.forEach(pos => {
            const powerup = this.matter.add.sprite(pos.x, pos.y, 'powerup', undefined, {
                isStatic: true,
                isSensor: true,
                label: 'powerup'
            });
            
            this.powerups.push(powerup);
            
            this.tweens.add({
                targets: powerup,
                y: pos.y - 20,
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            });
        });
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

    update() {
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
                const moveForce = 0.0015;
                const maxVelocity = 4; // Max horizontal speed

                // Get current velocity
                const currentVelocity = this.ball.body.velocity;

                if (this.cursors.left.isDown || this.keyA?.isDown) {
                    // Only apply force if we're under max speed
                    if (currentVelocity.x > -maxVelocity) {
                        this.ball.applyForce(new Phaser.Math.Vector2(-moveForce, 0));
                    }
                } else if (this.cursors.right.isDown || this.keyD?.isDown) {
                    // Only apply force if we're under max speed
                    if (currentVelocity.x < maxVelocity) {
                        this.ball.applyForce(new Phaser.Math.Vector2(moveForce, 0));
                    }
                }
            }
        }

        this.updateBackground();
    }

    protected boostBall() {
        if (!this.hasUnlimitedBoosts && this.boostsRemaining <= 0) return;
        if (!this.ball?.body) return;

        const boostPower = -0.015; // Middle ground between rocket and tiny hop
        this.ball.applyForce(new Phaser.Math.Vector2(0, boostPower));
        
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
                        // Stop any tweens on the powerup before destroying it
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

        // Create text at a fixed screen position
        const powerupText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 100,
            'UNLIMITED BOOSTS!',
            {
                fontSize: '24px',
                color: '#ffaa00'
            }
        ).setOrigin(0.5).setScrollFactor(0);
        
        // Simpler animation that doesn't depend on following objects
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
    }

    protected createPortal(x: number, y: number) {
        const portal = this.matter.add.sprite(x, y, 'portal', undefined, {
            isStatic: true,
            isSensor: true,
            label: 'portal'
        });
        
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
                    this.scene.start('Level2');
                }
            });
        });
    }
} 