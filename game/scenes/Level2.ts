import { BaseLevel } from './BaseLevel';

export class Level2 extends BaseLevel {
    constructor() {
        super('Level2');
    }

    create() {
        // Set up world bounds
        this.physics.world.setBounds(0, 0, 6400, 600);

        // Create background
        this.background = this.add.tileSprite(0, 0, 800, 600, 'platform')
            .setOrigin(0, 0)
            .setAlpha(0.1)
            .setTint(0x00ff00);

        // Initialize groups
        this.powerups = this.physics.add.staticGroup();
        this.platforms = this.physics.add.staticGroup();

        // Create level-specific layout
        this.createPlatforms();

        // Initialize ball
        this.ball = this.physics.add.sprite(100, 300, 'ball');
        this.ball.setCircle(15);
        this.ball.setCollideWorldBounds(true);
        this.ball.setBounce(0.2);
        this.ball.setDragX(300);
        this.ball.setMaxVelocity(400, 600);

        // Set up collisions
        this.physics.add.collider(this.ball, this.platforms, () => {
            this.isGrounded = true;
            this.boostsRemaining = 3;
            this.updateBoostUI();
        });

        // Set up camera
        this.cameras.main.startFollow(this.ball, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, 6400, 600);

        // Set up controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey('A');
        this.keyD = this.input.keyboard.addKey('D');
        const spaceKey = this.input.keyboard.addKey('SPACE');
        spaceKey.on('down', () => this.boostBall());

        // Add UI
        this.createBoostUI();
    }

    private createPlatforms() {
        // Level2-specific platform layout will go here
    }
} 