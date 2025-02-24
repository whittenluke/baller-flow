import Phaser from 'phaser';
import { BaseLevel } from './scenes/BaseLevel';
import MatterJS from 'matter-js';
import { Level2 } from './scenes/Level2';

export class LevelEditor extends Phaser.Scene {
    private platforms: MatterJS.Body[] = [];
    private drawingGraphics!: Phaser.GameObjects.Graphics;
    private previewGraphics!: Phaser.GameObjects.Graphics;
    private isDrawing: boolean = false;
    private currentPoints: Phaser.Math.Vector2[] = [];
    private dragCamera: boolean = false;
    private lastPointerPosition: Phaser.Math.Vector2 | null = null;
    private undoButton!: Phaser.GameObjects.Text;
    private saveButton!: Phaser.GameObjects.Text;
    private clearButton!: Phaser.GameObjects.Text;
    private testButton!: Phaser.GameObjects.Text;
    private levelToEdit: string;
    private selectedPlatform: MatterJS.Body | null = null;
    private controlPoints: Phaser.GameObjects.Rectangle[] = [];
    private drawMode: 'straight' | 'curve' = 'straight';
    private modeButton!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'LevelEditor' });
    }

    init(data: { levelId: string }) {
        console.log("Editor initialized with levelId:", data.levelId);
        this.levelToEdit = data.levelId;
    }

    create() {
        // Set up world with same bounds as game levels
        this.matter.world.setBounds(0, 0, 6400, 600);
        
        // Create background matching game style
        const background = this.add.tileSprite(0, 0, 6400, 600, 'platform')
            .setOrigin(0, 0)
            .setAlpha(0.1)
            .setTint(0x7700ff);

        // Setup camera with level-style bounds
        this.cameras.main.setBounds(0, 0, 6400, 600);
        this.cameras.main.setScroll(0, 0);

        // Enable Matter.js debug rendering
        this.matter.world.createDebugGraphic();
        this.matter.world.drawDebug = true;

        // Initialize graphics for drawing
        this.drawingGraphics = this.add.graphics({
            lineStyle: { width: 2, color: 0x7700ff, alpha: 1 }
        });

        // Setup camera drag (essential for editor)
        this.cameras.main.setBackgroundColor(0x000000);
        this.cameras.main.setScroll(0, 0);
        
        // Replace the existing UI creation with our new method
        this.createUI();

        // Add preview graphics layer
        this.previewGraphics = this.add.graphics({
            lineStyle: { width: 16, color: 0x7700ff, alpha: 0.5 }
        });

        // Add horizontal scroll with mouse wheel
        this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number) => {
            this.cameras.main.scrollX += deltaY;
        });

        // Fix camera drag with SHIFT
        this.input.keyboard?.addKey('SHIFT').on('down', () => {
            this.dragCamera = true;
            this.input.setDefaultCursor('grab');
        });
        
        this.input.keyboard?.addKey('SHIFT').on('up', () => {
            this.dragCamera = false;
            this.input.setDefaultCursor('default');
        });

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.dragCamera) {
                this.lastPointerPosition = new Phaser.Math.Vector2(pointer.x, pointer.y);
                this.input.setDefaultCursor('grabbing');
                return;
            }
            this.startDrawing(pointer);
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.dragCamera && this.lastPointerPosition) {
                const deltaX = pointer.x - this.lastPointerPosition.x;
                const deltaY = pointer.y - this.lastPointerPosition.y;
                this.cameras.main.scrollX -= deltaX;
                this.cameras.main.scrollY -= deltaY;
                this.lastPointerPosition.set(pointer.x, pointer.y);
                return;
            }

            if (this.isDrawing) {
                this.updateDrawing(pointer);
            }
        });

        this.input.on('pointerup', () => {
            if (this.dragCamera) {
                this.lastPointerPosition = null;
                this.input.setDefaultCursor('grab');
                return;
            }
            this.finishDrawing();
        });

        // Load level data based on levelId
        console.log("About to load level data for:", this.levelToEdit);
        if (this.levelToEdit === '2') {
            console.log("Loading Level 2 data...");
            this.loadLevel2Data();
        }

        // Add boundary guides
        const boundaryGraphics = this.add.graphics();
        boundaryGraphics.lineStyle(2, 0x0066ff, 0.3);
        
        // Draw level bounds
        boundaryGraphics.strokeRect(0, 0, 6400, 600);
        
        // Add vertical guides every 800 pixels
        for (let x = 800; x < 6400; x += 800) {
            boundaryGraphics.moveTo(x, 0);
            boundaryGraphics.lineTo(x, 600);
        }

        // Add horizontal guides at 1/3 and 2/3 height
        boundaryGraphics.moveTo(0, 200);
        boundaryGraphics.lineTo(6400, 200);
        boundaryGraphics.moveTo(0, 400);
        boundaryGraphics.lineTo(6400, 400);

        // Ensure UI stays on top
        this.modeButton.setDepth(1000);
        this.undoButton.setDepth(1000);
        this.clearButton.setDepth(1000);
        this.saveButton.setDepth(1000);
        this.testButton.setDepth(1000);
        
        // Make sure drawing happens above background but below UI
        this.drawingGraphics.setDepth(100);
        this.previewGraphics.setDepth(100);
        boundaryGraphics.setDepth(50);

        // Add platform selection handling
        this.matter.world.on('mousedown', (event: Phaser.Physics.Matter.Events.MouseDownEvent) => {
            if (this.dragCamera) return; // Don't select while camera dragging
            
            const body = event.body as MatterJS.Body;
            if (body && body.label === 'platform') {
                this.selectPlatform(body);
            } else {
                this.deselectPlatform();
            }
        });
    }

    private createUI() {
        const uiContainer = this.add.container(10, 10);
        
        // Create mode toggle first
        this.modeButton = this.add.text(0, 0, 'MODE: STRAIGHT', {
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 },
            color: '#ffffff'
        }).setInteractive();

        this.undoButton = this.add.text(150, 0, 'UNDO', { 
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 },
            color: '#ffffff'
        }).setInteractive();

        this.clearButton = this.add.text(240, 0, 'CLEAR', {
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 },
            color: '#ffffff'
        }).setInteractive();

        this.saveButton = this.add.text(330, 0, 'SAVE', {
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 },
            color: '#ffffff'
        }).setInteractive();

        this.testButton = this.add.text(420, 0, 'TEST', {
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 },
            color: '#ffffff'
        }).setInteractive();

        // Add all buttons to container
        uiContainer.add([this.modeButton, this.undoButton, this.clearButton, this.saveButton, this.testButton]);
        
        // Ensure UI stays on top
        uiContainer.setDepth(1000);
        uiContainer.setScrollFactor(0);

        // Add button handlers
        this.modeButton.on('pointerdown', this.toggleDrawMode, this);
        this.undoButton.on('pointerdown', this.undoLastPlatform, this);
        this.clearButton.on('pointerdown', this.clearAllPlatforms, this);
        this.saveButton.on('pointerdown', this.savePlatformData, this);
        this.testButton.on('pointerdown', this.testLevel, this);

        // Add keyboard shortcuts
        this.input.keyboard?.addKey('Z').on('down', (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey) {
                this.undoLastPlatform();
            }
        });
    }

    private toggleDrawMode() {
        this.drawMode = this.drawMode === 'straight' ? 'curve' : 'straight';
        this.modeButton.setText(`MODE: ${this.drawMode.toUpperCase()}`);
        // Clear any in-progress drawing
        this.isDrawing = false;
        this.currentPoints = [];
        this.previewGraphics.clear();
    }

    private startDrawing(pointer: Phaser.Input.Pointer) {
        if (this.dragCamera) return;
        
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.isDrawing = true;
        this.currentPoints = [new Phaser.Math.Vector2(worldPoint.x, worldPoint.y)];
        this.previewGraphics.clear();
    }

    private updateDrawing(pointer: Phaser.Input.Pointer) {
        if (!this.isDrawing) return;

        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        
        if (this.drawMode === 'straight') {
            // For straight lines, just show line from start to current point
            this.previewGraphics.clear();
            this.previewGraphics.lineStyle(16, 0x7700ff, 0.5);
            this.previewGraphics.beginPath();
            this.previewGraphics.moveTo(this.currentPoints[0].x, this.currentPoints[0].y);
            this.previewGraphics.lineTo(worldPoint.x, worldPoint.y);
            this.previewGraphics.strokePath();
        } else {
            // For curves, add points as we move
            const lastPoint = this.currentPoints[this.currentPoints.length - 1];
            const distance = Phaser.Math.Distance.Between(
                lastPoint.x, lastPoint.y,
                worldPoint.x, worldPoint.y
            );

            if (distance > 20) {
                this.currentPoints.push(new Phaser.Math.Vector2(worldPoint.x, worldPoint.y));
                this.previewGraphics.clear();
                this.previewGraphics.lineStyle(16, 0x7700ff, 0.5);
                this.previewGraphics.beginPath();
                this.previewGraphics.moveTo(this.currentPoints[0].x, this.currentPoints[0].y);
                
                for (const point of this.currentPoints) {
                    this.previewGraphics.lineTo(point.x, point.y);
                }
                this.previewGraphics.strokePath();
            }
        }
    }

    private finishDrawing() {
        if (!this.isDrawing || this.currentPoints.length < 1) {
            this.isDrawing = false;
            this.previewGraphics.clear();
            return;
        }

        const worldPoint = this.cameras.main.getWorldPoint(
            this.input.activePointer.x,
            this.input.activePointer.y
        );

        if (this.drawMode === 'straight') {
            // Create single straight platform
            const start = this.currentPoints[0];
            const end = new Phaser.Math.Vector2(worldPoint.x, worldPoint.y);
            
            const platform = this.matter.add.rectangle(
                (start.x + end.x) / 2,
                (start.y + end.y) / 2,
                Phaser.Math.Distance.Between(start.x, start.y, end.x, end.y),
                16,
                {
                    ...BaseLevel.PLATFORM_CONFIG,
                    angle: Math.atan2(end.y - start.y, end.x - start.x)
                }
            );
            this.platforms.push(platform);
        } else {
            // Create curved platform segments
            for (let i = 0; i < this.currentPoints.length - 1; i++) {
                const current = this.currentPoints[i];
                const next = this.currentPoints[i + 1];
                
                const platform = this.matter.add.rectangle(
                    (current.x + next.x) / 2,
                    (current.y + next.y) / 2,
                    Phaser.Math.Distance.Between(current.x, current.y, next.x, next.y),
                    16,
                    {
                        ...BaseLevel.PLATFORM_CONFIG,
                        angle: Math.atan2(next.y - current.y, next.x - current.x)
                    }
                );
                this.platforms.push(platform);
            }
        }

        this.isDrawing = false;
        this.previewGraphics.clear();
        this.currentPoints = [];
    }

    private redraw() {
        this.drawingGraphics.clear();
        if (this.currentPoints.length < 2) return;

        this.drawingGraphics.lineStyle(16, 0x7700ff);
        this.drawingGraphics.beginPath();
        this.drawingGraphics.moveTo(this.currentPoints[0].x, this.currentPoints[0].y);

        for (let i = 1; i < this.currentPoints.length; i++) {
            this.drawingGraphics.lineTo(this.currentPoints[i].x, this.currentPoints[i].y);
        }
        this.drawingGraphics.strokePath();
    }

    private savePlatformData() {
        // Generate the platform code
        const code = this.generatePlatformCode();
        console.log(code); // For now just log it
        
        // Could also download as a file or copy to clipboard
        navigator.clipboard.writeText(code).then(() => {
            this.add.text(200, 10, 'Code copied!', { color: '#00ff00' })
                .setAlpha(1)
                .setDepth(1000);
        });
    }

    private generatePlatformCode(): string {
        // Generate the actual TypeScript code for the platform
        return `
// Platform points
const points = [
    ${this.currentPoints.map(p => `new Phaser.Math.Vector2(${p.x}, ${p.y})`).join(',\n    ')}
];

// Create platform segments
points.forEach((point, i) => {
    if (i < points.length - 1) {
        const next = points[i + 1];
        const segment = this.matter.bodies.rectangle(
            (point.x + next.x) / 2,
            (point.y + next.y) / 2,
            Phaser.Math.Distance.Between(point.x, point.y, next.x, next.y),
            16,
            {
                ...BaseLevel.PLATFORM_CONFIG,
                angle: Math.atan2(next.y - point.y, next.x - point.x)
            }
        );
        this.matter.world.add(segment);
        this.platforms.push(segment);
    }
});
        `.trim();
    }

    private undoLastPlatform() {
        const lastPlatform = this.platforms.pop();
        if (lastPlatform) {
            this.matter.world.remove(lastPlatform);
        }
    }

    private clearAllPlatforms() {
        for (const platform of this.platforms) {
            this.matter.world.remove(platform);
        }
        this.platforms = [];
        this.currentPoints = [];
        this.drawingGraphics.clear();
        this.previewGraphics.clear();
    }

    private testLevel() {
        // Store current platforms
        const platformData = this.platforms.map(platform => ({
            x: platform.position.x,
            y: platform.position.y,
            width: (platform as any).width,
            angle: platform.angle
        }));

        // Save to temporary storage
        localStorage.setItem('testLevelData', JSON.stringify(platformData));

        // Switch to test scene
        this.scene.start('TestLevel');
    }

    private loadLevel2Data() {
        // Create flat starting platform
        const startPlatform = this.matter.add.rectangle(
            100, 150, 200, 16,
            {
                ...BaseLevel.PLATFORM_CONFIG,
                isStatic: true,
                label: 'platform'
            }
        );
        this.platforms.push(startPlatform);

        // Create points for the curve
        const startX = 200;
        const startY = 150;
        
        // Create the curve path
        const path = new Phaser.Curves.Path(startX, startY);
        path.quadraticBezierTo(startX + 550, startY, startX + 1100, startY + 200);
        
        // Sample points along the curve
        const points = path.getPoints(20);

        // Create physics bodies for each segment
        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            const angle = Math.atan2(next.y - current.y, next.x - current.x);
            
            const segment = this.matter.add.rectangle(
                (current.x + next.x) / 2,
                (current.y + next.y) / 2,
                Phaser.Math.Distance.Between(current.x, current.y, next.x, next.y),
                16,
                {
                    ...BaseLevel.PLATFORM_CONFIG,
                    angle: angle
                }
            );
            
            this.platforms.push(segment);
        }

        // Draw the visual curve
        this.drawingGraphics.lineStyle(16, 0x7700ff);
        this.drawingGraphics.beginPath();
        this.drawingGraphics.moveTo(points[0].x, points[0].y);
        
        for (const point of points) {
            this.drawingGraphics.lineTo(point.x, point.y);
        }
        this.drawingGraphics.strokePath();
    }

    private selectPlatform(platform: MatterJS.Body) {
        this.deselectPlatform(); // Clear any existing selection
        this.selectedPlatform = platform;

        // Create control points at platform ends
        const angle = platform.angle;
        const length = (platform as any).width;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        // Calculate end points
        const x1 = platform.position.x - (length/2) * cos;
        const y1 = platform.position.y - (length/2) * sin;
        const x2 = platform.position.x + (length/2) * cos;
        const y2 = platform.position.y + (length/2) * sin;

        // Create draggable control points
        const controlPoint1 = this.add.rectangle(x1, y1, 10, 10, 0xffff00);
        const controlPoint2 = this.add.rectangle(x2, y2, 10, 10, 0xffff00);
        
        [controlPoint1, controlPoint2].forEach((point, index) => {
            point.setInteractive();
            this.input.setDraggable(point);
            point.on('drag', (pointer: Phaser.Input.Pointer) => {
                this.updatePlatformFromControl(point, index);
            });
        });

        this.controlPoints = [controlPoint1, controlPoint2];
    }

    private deselectPlatform() {
        this.selectedPlatform = null;
        this.controlPoints.forEach(point => point.destroy());
        this.controlPoints = [];
    }

    private updatePlatformFromControl(point: Phaser.GameObjects.Rectangle, index: number) {
        if (!this.selectedPlatform) return;

        const otherPoint = this.controlPoints[1 - index];
        const angle = Math.atan2(point.y - otherPoint.y, point.x - otherPoint.x);
        const length = Phaser.Math.Distance.Between(point.x, point.y, otherPoint.x, otherPoint.y);
        
        // Update the Matter.js body
        this.matter.body.setPosition(this.selectedPlatform, {
            x: (point.x + otherPoint.x) / 2,
            y: (point.y + otherPoint.y) / 2
        });
        this.matter.body.setAngle(this.selectedPlatform, angle);
        // Update length would require recreating the body
    }
}

// Add a new test scene class
export class TestLevel extends BaseLevel {
    constructor() {
        super({ key: 'TestLevel' });
    }

    create() {
        super.create();

        // Load platforms from temporary storage
        const platformData = JSON.parse(localStorage.getItem('testLevelData') || '[]');
        
        for (const data of platformData) {
            const platform = this.matter.add.rectangle(
                data.x, data.y,
                data.width, 16,
                {
                    ...BaseLevel.PLATFORM_CONFIG,
                    angle: data.angle
                }
            );
            this.platforms.push(platform);
        }

        // Add return to editor button
        const returnButton = this.add.text(10, 10, 'RETURN TO EDITOR', {
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 },
            color: '#ffffff'
        })
        .setScrollFactor(0)
        .setInteractive()
        .on('pointerdown', () => this.scene.start('LevelEditor'));

        // Initialize player at start position
        this.createBall(100, 300);
    }
} 