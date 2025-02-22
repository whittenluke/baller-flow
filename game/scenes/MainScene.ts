import { Scene } from 'phaser';

export class MainScene extends Scene {
  private ball!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private background!: Phaser.GameObjects.TileSprite;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Create ball texture
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xffffff);
    graphics.fillStyle(0x7700ff, 1);
    graphics.strokeCircle(0, 0, 16);
    graphics.fillCircle(0, 0, 16);
    graphics.generateTexture('ball', 32, 32);
    graphics.destroy();

    // Create platform texture
    const platformGraphics = this.add.graphics();
    platformGraphics.fillStyle(0x444444);
    platformGraphics.fillRect(0, 0, 200, 32);
    platformGraphics.lineStyle(2, 0x7700ff);
    platformGraphics.strokeRect(0, 0, 200, 32);
    platformGraphics.generateTexture('platform', 200, 32);
    platformGraphics.destroy();
  }

  create() {
    // Set up world bounds (much wider than screen)
    this.physics.world.setBounds(0, 0, 3200, 600);

    // Create scrolling background
    this.background = this.add.tileSprite(0, 0, 800, 600, 'platform')
      .setOrigin(0, 0)
      .setAlpha(0.1);

    // Create platforms group
    this.platforms = this.physics.add.staticGroup();

    // Create some initial platforms
    this.createPlatforms();

    // Initialize ball with physics
    this.ball = this.physics.add.sprite(100, 300, 'ball');
    this.ball.setCollideWorldBounds(true);
    this.ball.setBounce(0.2);
    this.ball.setDragX(300); // Add drag for better control
    this.ball.setMaxVelocity(400, 600); // Limit max speed

    // Set up collisions
    this.physics.add.collider(this.ball, this.platforms);

    // Set up camera to follow ball
    this.cameras.main.startFollow(this.ball, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 3200, 600);

    // Initialize controls
    this.cursors = this.input.keyboard.createCursorKeys();

    // Add space key for boost
    const spaceKey = this.input.keyboard.addKey('SPACE');
    spaceKey.on('down', this.boostBall, this);
  }

  private createPlatforms() {
    // Create ground
    this.platforms.create(400, 568, 'platform').setScale(4).refreshBody();

    // Create some platforms
    const platformPositions = [
      { x: 600, y: 400 },
      { x: 800, y: 300 },
      { x: 1000, y: 400 },
      { x: 1200, y: 200 },
      { x: 1500, y: 350 }
    ];

    platformPositions.forEach(pos => {
      this.platforms.create(pos.x, pos.y, 'platform');
    });
  }

  update() {
    this.handleInput();
    this.updateBackground();
  }

  private handleInput() {
    // Horizontal movement with momentum
    if (this.cursors.left.isDown || this.input.keyboard.addKey('A').isDown) {
      this.ball.setAccelerationX(-300);
    } else if (this.cursors.right.isDown || this.input.keyboard.addKey('D').isDown) {
      this.ball.setAccelerationX(300);
    } else {
      this.ball.setAccelerationX(0);
    }
  }

  private boostBall() {
    // Always allow boost, adding to current velocity for better control
    const boostPower = -300;
    this.ball.setVelocityY(this.ball.body.velocity.y + boostPower);
    
    // Add a small upward particle effect without text
    const particles = this.add.particles(0, 0, 'ball', {
      speed: 100,
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.3, end: 0 },
      lifespan: 200,
      blendMode: 'ADD',
      quantity: 1
    });
    
    particles.startFollow(this.ball);
    this.time.delayedCall(100, () => particles.destroy());
  }

  private updateBackground() {
    // Parallax scrolling effect
    this.background.tilePositionX = this.cameras.main.scrollX * 0.6;
  }
}