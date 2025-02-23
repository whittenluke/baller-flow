import { BaseLevel } from './BaseLevel';
import Phaser from 'phaser';

export class Level2 extends BaseLevel {
    private curve!: Phaser.Curves.QuadraticBezier;
    private rampGraphics!: Phaser.GameObjects.Graphics;

    constructor() {
        super('Level2');
    }

    create() {
        // Set up world bounds
        this.physics.world.setBounds(0, 0, 6400, 600);

        // Create background with unique tint
        this.background = this.add.tileSprite(0, 0, 800, 600, 'platform')
            .setOrigin(0, 0)
            .setAlpha(0.1)
            .setTint(0x00ff00);

        // Initialize groups
        this.platforms = this.physics.add.staticGroup();
        this.powerups = this.physics.add.staticGroup();

        // Create the curved ramp
        this.createSmoothRamp();

        // Initialize ball at the top of the ramp
        this.ball = this.physics.add.sprite(200, 100, 'ball');
        this.ball.setCircle(15);
        this.ball.setCollideWorldBounds(true);
        this.ball.setBounce(0.1);
        this.ball.setDragX(25); // Reduced drag for better rolling
        this.ball.setMaxVelocity(400, 600);

        // Set up collisions with the ramp
        this.physics.add.collider(this.ball, this.platforms, () => {
            this.isGrounded = true;
            this.boostsRemaining = 3;
            this.updateBoostUI();
        });

        // Set up powerup collection
        this.setupPowerupCollection();

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

        // Add UI
        this.createBoostUI();

        // Create portal to next level
        this.createPortal(6200, 300);
    }

    private createSmoothRamp() {
        // Create a smooth curve
        const startPoint = new Phaser.Math.Vector2(200, 150);
        const controlPoint = new Phaser.Math.Vector2(800, 150);
        const endPoint = new Phaser.Math.Vector2(1300, 450);

        this.curve = new Phaser.Curves.QuadraticBezier(startPoint, controlPoint, endPoint);

        // Draw the curve
        this.rampGraphics = this.add.graphics();
        this.rampGraphics.lineStyle(16, 0x7700ff, 1);
        this.curve.draw(this.rampGraphics);

        // Get points along the curve for collision
        const points = this.curve.getPoints(128); // More points for smoother collision
        
        // Create overlapping collision bodies along the curve
        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            
            // Create an invisible platform that follows the curve
            const platform = this.platforms.create(
                current.x,
                current.y,
                'platform'
            );
            
            // Calculate angle and distance
            const angle = Phaser.Math.Angle.BetweenPoints(current, next);
            const distance = Phaser.Math.Distance.BetweenPoints(current, next);
            
            // Make it invisible and very small
            platform.setAlpha(0);
            platform.setScale(distance / 100, 0.02); // Extra thin for smoother collision
            platform.setRotation(angle);
            
            // Adjust the physics body
            const body = platform.body as Phaser.Physics.Arcade.Body;
            if (body) {
                body.setSize(distance, 2); // Very thin collision
                body.setOffset(0, -1);
            }
            
            platform.refreshBody();
        }

        // Create starting platform
        const startPlatform = this.platforms.create(200, 150, 'platform');
        startPlatform.setScale(0.5, 0.2);
        startPlatform.refreshBody();

        // Add powerups along the curve
        this.addPowerups(points);
    }

    private addPowerups(points: Phaser.Math.Vector2[]) {
        // Add powerups at strategic points
        const powerupIndices = [32, 64, 96]; // Adjusted for 128 points
        
        powerupIndices.forEach(index => {
            if (points[index]) {
                const powerup = this.powerups.create(
                    points[index].x,
                    points[index].y - 30,
                    'powerup'
                );
                
                this.tweens.add({
                    targets: powerup,
                    y: points[index].y - 50,
                    duration: 1500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.inOut'
                });
            }
        });
    }

    private createPortal(x: number, y: number) {
        const portal = this.physics.add.staticSprite(x, y, 'portal');
        
        this.tweens.add({
            targets: portal,
            alpha: 0.7,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });

        this.physics.add.overlap(this.ball, portal, () => {
            this.scene.start('Level3');
        });
    }
} 