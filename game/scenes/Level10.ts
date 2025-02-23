import { BaseLevel } from './BaseLevel';

export class Level10 extends BaseLevel {
    constructor() {
        super('Level10');
    }

    create() {
        // Set up world bounds
        this.physics.world.setBounds(0, 0, 6400, 600);

        // Create background with unique tint
        this.background = this.add.tileSprite(0, 0, 800, 600, 'platform')
            .setOrigin(0, 0)
            .setAlpha(0.1)
            .setTint(0x9900ff);

        // Initialize groups
        this.platforms = this.physics.add.staticGroup();
        this.powerups = this.physics.add.staticGroup();

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

        // Create victory portal
        this.createVictoryPortal(6200, 300);
    }

    private createPlatforms() {
        // Level10-specific platform layout will go here
    }

    private createVictoryPortal(x: number, y: number) {
        const portal = this.physics.add.staticSprite(x, y, 'portal');
        
        // Make the final portal more special with a golden glow
        portal.setTint(0xffdd00);
        
        this.tweens.add({
            targets: portal,
            alpha: 0.7,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });

        this.physics.add.overlap(this.ball, portal, () => {
            // Show victory screen or return to menu
            this.showVictoryScreen();
        });
    }

    private showVictoryScreen() {
        const victoryText = this.add.text(400, 300, 'VICTORY!\nYou\'ve completed all levels!\nPress R to play again', {
            fontSize: '32px',
            color: '#ffdd00',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0);

        this.ball.setVelocity(0, 0);
        this.ball.setAcceleration(0, 0);
        this.isGameOver = true;

        // Add restart handler
        const restartKey = this.input.keyboard?.addKey('R');
        restartKey?.on('down', () => {
            victoryText.destroy();
            this.scene.start('Level1');
        });
    }
} 