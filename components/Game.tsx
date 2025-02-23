"use client";

import { useEffect, useRef, useState } from "react";
import { PHASER_CONFIG } from "@/lib/phaser.config";
import { Level1 } from "@/game/scenes/Level1";
import { Level2 } from "@/game/scenes/Level2";
import { loadPhaser, PhaserGame } from "@/lib/phaser";

export default function Game() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gameRef = useRef<PhaserGame | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPlaying) return;

    async function initGame() {
      if (typeof window === "undefined") return;
      
      console.log("Loading Phaser...");
      const Phaser = await loadPhaser();
      if (!Phaser) {
        setError("Failed to load Phaser");
        return;
      }
      console.log("Phaser loaded successfully");

      const config = {
        ...PHASER_CONFIG,
        parent: containerRef.current || undefined,
        scene: [Level1, Level2],
        width: 800,
        height: 600,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 800,
          height: 600
        },
        render: {
          pixelArt: false,
          antialias: true,
          transparent: false
        }
      };

      try {
        console.log("Initializing game with config:", config);
        gameRef.current = new Phaser.Game(config);
        console.log("Game initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Phaser game:", error);
        setError(error instanceof Error ? error.message : "Failed to initialize game");
      }
    }

    initGame();

    return () => {
      if (gameRef.current) {
        console.log("Destroying game instance");
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [isPlaying]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {!isPlaying ? (
        <div className="text-center">
          <button
            onClick={() => setIsPlaying(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            START GAME
          </button>
        </div>
      ) : (
        <>
          <div 
            ref={containerRef}
            className="rounded-lg overflow-hidden shadow-2xl border-4 border-purple-500 aspect-[4/3] w-full bg-black"
          />
          {error && (
            <div className="text-red-500 text-center mt-4">
              Error: {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}