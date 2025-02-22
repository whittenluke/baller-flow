import { GameConfig } from '@/lib/phaser';

export const PHASER_CONFIG: GameConfig = {
  type: 0,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600 },
      debug: true,
    },
  },
  backgroundColor: '#000000',
  banner: false,
  render: {
    pixelArt: false,
    antialias: true,
    transparent: false
  }
}; 