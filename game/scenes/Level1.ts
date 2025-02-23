import { BaseLevel } from './BaseLevel';
import Phaser from 'phaser';
import MatterJS from 'matter-js';

export class Level1 extends BaseLevel {
    constructor() {
        super('Level1');
    }

    protected initialize(): void {
        // Set up world bounds
        this.matter.world.setBounds(0, 0, 6400, 600);

        // Initialize arrays
        this.platforms = [];
        this.powerups = [];

        // Create background
        this.createBackground();

        // Create platforms and powerups
        this.createPlatforms();

        // Initialize ball
        this.createBall(100, 300);

        // Set up controls and UI
        this.createBoostUI();

        // Create portal to next level
        this.createPortal(300, 300, 'Level2');
    }

    private createPlatforms(): void {
        const SECTION_WIDTH = 800;
        
        for (let section = 0; section < 8; section++) {
            const sectionStart = section * SECTION_WIDTH;
            
            if (section % 2 === 0) {
                this.createSolidSection(sectionStart);
            } else {
                this.createPlatformSection(sectionStart);
            }
        }
    }

    private createSolidSection(startX: number): void {
        const platformHeight = 200;
        const isFirstSection = startX === 0;
        
        if (!isFirstSection) {
            const platform = this.matter.bodies.rectangle(
                startX + 400,
                platformHeight,
                700,
                32,
                BaseLevel.PLATFORM_CONFIG
            ) as MatterJS.Body;
            this.matter.world.add(platform);
            this.platforms.push(platform);
        }

        const platform2 = this.matter.bodies.rectangle(
            startX + 400,
            platformHeight + 150,
            700,
            32,
            BaseLevel.PLATFORM_CONFIG
        ) as MatterJS.Body;
        this.matter.world.add(platform2);
        this.platforms.push(platform2);
    }

    private createPlatformSection(startX: number): void {
        const platformPositions = [
            { x: startX + 200, y: 400 },
            { x: startX + 400, y: 300 },
            { x: startX + 600, y: 350 },
            { x: startX + 700, y: 250 }
        ];

        platformPositions.forEach(pos => {
            const platform = this.matter.bodies.rectangle(
                pos.x, pos.y, 200, 32, 
                BaseLevel.PLATFORM_CONFIG
            ) as MatterJS.Body;
            this.matter.world.add(platform);
            this.platforms.push(platform);
        });

        this.createPowerupsInSection(startX);
    }

    private createPowerupsInSection(startX: number): void {
        const powerupPositions = [
            { x: startX + 400, y: 200 },
            { x: startX + 600, y: 250 }
        ];

        powerupPositions.forEach(pos => {
            const powerup = this.matter.add.sprite(
                pos.x, pos.y, 'powerup', undefined, 
                BaseLevel.POWERUP_CONFIG
            );
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
        // Implementation of createBoostUI method
    }

    protected createPortal(x: number, y: number, nextLevel: string): Phaser.Physics.Matter.Sprite {
        const portal = this.matter.add.sprite(x, y, 'portal', undefined, BaseLevel.PORTAL_CONFIG) as Phaser.Physics.Matter.Sprite;
        
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
                    this.scene.start(nextLevel);
                }
            });
        });

        return portal;
    }
} 