import { Scene } from 'phaser';

export class MainScene extends Scene {
  private ball!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Create a white circle as our ball
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xffffff);
    graphics.fillStyle(0x7700ff, 1);
    graphics.strokeCircle(0, 0, 16);
    graphics.fillCircle(0, 0, 16);
    graphics.generateTexture('ball', 32, 32);
    graphics.destroy();
  }

  create() {
    // Set background color
    this.cameras.main.setBackgroundColor('#000000');

    // Initialize ball with generated texture
    this.ball = this.physics.add.sprite(400, 100, 'ball');
    this.ball.setCollideWorldBounds(true);
    this.ball.setBounce(0.6);
    this.ball.setTint(0x7700ff);
    
    // Set up initial physics
    this.ball.setVelocityY(300);
    this.ball.setDragX(100);
    
    // Initialize controls
    this.cursors = this.input.keyboard.createCursorKeys();

    // Set up world bounds
    this.physics.world.setBounds(50, 0, 700, 600);

    // Create tunnel walls
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0x7700ff, 1);
    graphics.strokeRect(50, 0, 700, 600);

    // Add controls text
    this.add.text(10, 10, 'SPACE to Boost\nA/D or ←/→ to Move', { 
      fontSize: '16px',
      color: '#ffffff' 
    });

    // Add space key for boost
    const spaceKey = this.input.keyboard.addKey('SPACE');
    spaceKey.on('down', this.boostBall, this);
  }

  update() {
    this.handleInput();
  }

  private handleInput() {
    // Horizontal movement
    if (this.cursors.left.isDown || this.input.keyboard.addKey('A').isDown) {
      this.ball.setVelocityX(-400);
    } else if (this.cursors.right.isDown || this.input.keyboard.addKey('D').isDown) {
      this.ball.setVelocityX(400);
    } else {
      this.ball.setVelocityX(this.ball.body.velocity.x * 0.97);
    }
  }

  private boostBall() {
    // Gentler boost that adds to current velocity
    const boostPower = -200;
    this.ball.setVelocityY(this.ball.body.velocity.y + boostPower);
    this.createBoostEffect();
  }

  private createBoostEffect() {
    const effect = this.add.text(this.ball.x, this.ball.y - 50, 'BOOST!', {
      fontSize: '20px',
      color: '#7700ff'
    });
    
    this.tweens.add({
      targets: effect,
      y: effect.y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => effect.destroy()
    });
  }
}