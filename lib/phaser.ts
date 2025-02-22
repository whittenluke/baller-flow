// Type definitions only - no direct imports
export type PhaserGame = any;
export type PhaserScene = any;
export type PhaserTypes = any;
export type PhaserPhysics = any;
export type GameConfig = {
  type: number;
  width: number;
  height: number;
  physics: {
    default: string;
    arcade: {
      gravity: { y: number };
      debug: boolean;
    };
  };
  backgroundColor: string;
  banner: boolean;
  parent?: HTMLElement;
  scene?: any;
};

// Async loader function
export async function loadPhaser() {
  if (typeof window !== 'undefined') {
    const Phaser = (await import('phaser')).default;
    return {
      Game: Phaser.Game,
      Scene: Phaser.Scene,
      AUTO: Phaser.AUTO,
      Types: Phaser.Types,
      Physics: Phaser.Physics,
      Input: Phaser.Input,
      GameObjects: Phaser.GameObjects,
      Display: Phaser.Display
    };
  }
  return null;
} 