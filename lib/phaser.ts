// Type definitions only - no direct imports
export type PhaserGame = any;
export type PhaserScene = any;
export type PhaserTypes = any;
export type PhaserPhysics = any;

// Change this from 'auto' to 0 (PHASER_AUTO constant value)
export const AUTO = 0;

export type GameConfig = {
  type: number;  // Change back to number
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
  scale?: {
    mode?: any;
    autoCenter?: any;
    width: number;
    height: number;
  };
  render?: {
    pixelArt: boolean;
    antialias: boolean;
    transparent: boolean;
  };
};

// Async loader function with error handling
export async function loadPhaser() {
  if (typeof window !== 'undefined') {
    try {
      const Phaser = (await import('phaser')).default;
      return {
        Game: Phaser.Game,
        Scene: Phaser.Scene,
        AUTO: Phaser.AUTO, // This will give us the correct AUTO value
        Scale: Phaser.Scale,
        Physics: Phaser.Physics,
        Input: Phaser.Input,
        GameObjects: Phaser.GameObjects,
        Display: Phaser.Display
      };
    } catch (error) {
      console.error('Failed to load Phaser:', error);
      return null;
    }
  }
  return null;
} 