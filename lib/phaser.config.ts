import { AUTO, GameConfig } from '@/lib/phaser';

export const PHASER_CONFIG: GameConfig = {
  type: AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600 },
      debug: false,
    },
  },
  backgroundColor: '#000000',
  banner: false
}; 