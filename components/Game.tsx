"use client";

import { useEffect, useRef, useState } from "react";
import { PHASER_CONFIG } from "@/lib/phaser.config";
import { MainScene } from "@/game/scenes/MainScene";
import { loadPhaser, PhaserGame } from "@/lib/phaser";

export default function Game() {
  const [isPlaying, setIsPlaying] = useState(false);
  const gameRef = useRef<PhaserGame | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPlaying) return;

    async function initGame() {
      if (typeof window === "undefined") return;
      
      const Phaser = await loadPhaser();
      if (!Phaser) return;

      const config = {
        ...PHASER_CONFIG,
        parent: containerRef.current || undefined,
        scene: MainScene,
      };

      try {
        gameRef.current = new Phaser.Game(config);
      } catch (error) {
        console.error("Failed to initialize Phaser game:", error);
      }
    }

    initGame();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [isPlaying]);

  if (!isPlaying) {
    return (
      <div className="text-center">
        <button
          onClick={() => setIsPlaying(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          START GAME
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="rounded-lg overflow-hidden shadow-2xl border-4 border-purple-500"
    />
  );
}