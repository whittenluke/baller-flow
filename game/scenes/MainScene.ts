import { PhaserScene, PhaserPhysics } from '@/lib/phaser';

export class MainScene {
  private ball!: any;
  private platforms!: any;
  private flowMeter: number = 100;
  private flowText!: any;
  private cursors!: any;
  private lastBounceTime: number = 0;
  private combo: number = 0;
  private scene: any;
  private physics: any;
  private input: any;
  private add: any;
  private time: any;
  private tweens: any;

  constructor() {
    // Scene configuration will be set when Phaser is loaded
    return this;
  }

  preload() {
    // Load game assets
    this.load.image("ball", "https://labs.phaser.io/assets/particles/blue.png");
    this.load.image("platform", "https://labs.phaser.io/assets/sprites/platform.png");
  }

  create() {
    // Create game objects
    this.createPlatforms();
    this.createBall();
    this.createUI();
    
    // Setup controls
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Add A and D key controls
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    
    // Setup collisions
    this.physics.add.collider(this.ball, this.platforms, this.handleBounce, undefined, this);
  }

  update() {
    this.handleInput();
    this.updateFlowMeter();
    this.checkGameOver();
  }

  private createPlatforms() {
    this.platforms = this.physics.add.staticGroup();
    
    // Create base platform
    this.platforms.create(400, 580, "platform").setScale(2).refreshBody();
    
    // Add some floating platforms
    this.platforms.create(600, 400, "platform");
    this.platforms.create(50, 250, "platform");
    this.platforms.create(750, 220, "platform");
  }

  private createBall() {
    this.ball = this.physics.add.sprite(400, 100, "ball");
    this.ball.setBounce(0.8);
    this.ball.setCollideWorldBounds(true);
    this.ball.setTint(0x00ff00);
  }

  private createUI() {
    this.flowText = this.add.text(16, 16, "Flow: 100", {
      fontSize: "32px",
      color: "#ffffff"
    });
  }

  private handleInput() {
    const moveSpeed = 300;
    
    if (this.cursors.left.isDown || this.input.keyboard.keys[65]?.isDown) { // A key
      this.ball.setVelocityX(-moveSpeed);
    } else if (this.cursors.right.isDown || this.input.keyboard.keys[68]?.isDown) { // D key
      this.ball.setVelocityX(moveSpeed);
    } else {
      this.ball.setVelocityX(0);
    }
  }

  private handleBounce(ball: Phaser.Physics.Arcade.Sprite, platform: Phaser.Physics.Arcade.Sprite) {
    const currentTime = this.time.now;
    const timeSinceLastBounce = currentTime - this.lastBounceTime;
    
    if (timeSinceLastBounce > 500) { // Prevent multiple bounces counting
      this.combo++;
      this.flowMeter += this.combo * 2;
      this.lastBounceTime = currentTime;
      
      // Visual feedback
      this.tweens.add({
        targets: ball,
        scale: { from: 1.2, to: 1 },
        duration: 200,
        ease: "Quad.easeOut"
      });
    }
  }

  private updateFlowMeter() {
    this.flowMeter = Math.max(0, Math.min(100, this.flowMeter - 0.1));
    this.flowText.setText(`Flow: ${Math.floor(this.flowMeter)}`);
    
    // Update ball color based on flow meter
    const greenComponent = Math.floor((this.flowMeter / 100) * 255);
    const redComponent = Math.floor(((100 - this.flowMeter) / 100) * 255);
    this.ball.setTint(Phaser.Display.Color.GetColor(redComponent, greenComponent, 0));
  }

  private checkGameOver() {
    if (this.flowMeter <= 0) {
      this.scene.pause();
      this.add.text(400, 300, "GAME OVER", {
        fontSize: "64px",
        color: "#ff0000"
      }).setOrigin(0.5);
      
      this.add.text(400, 380, "Click to restart", {
        fontSize: "32px",
        color: "#ffffff"
      }).setOrigin(0.5);
      
      this.input.once("pointerdown", () => {
        this.scene.restart();
      });
    }
  }
}