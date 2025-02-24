"use client";

import { useEffect, useRef, useState } from "react";
import { PHASER_CONFIG } from "@/lib/phaser.config";
import { loadPhaser, PhaserGame } from "@/lib/phaser";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LevelEditor, TestLevel } from "@/game/LevelEditor";

interface LevelEditorClientProps {
    levelId: string;
}

export function LevelEditorClient({ levelId }: LevelEditorClientProps) {
    const [error, setError] = useState<string | null>(null);
    const gameRef = useRef<PhaserGame | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function initEditor() {
            if (typeof window === "undefined") return;
            
            const Phaser = await loadPhaser();
            
            const config = {
                ...PHASER_CONFIG,
                parent: containerRef.current || undefined,
                scene: [],
                width: 800,
                height: 600,
                physics: {
                    default: 'matter',
                    matter: {
                        debug: false,
                        gravity: { y: 0.5 }
                    }
                },
                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_BOTH,
                    width: 800,
                    height: 600
                }
            };

            try {
                const game = new Phaser.Game({
                    ...config,
                    scene: []
                });
                game.scene.add('LevelEditor', LevelEditor);
                game.scene.add('TestLevel', TestLevel);
                game.scene.start('LevelEditor', { levelId });
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to initialize editor");
            }
        }

        initEditor();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-white">
                        Editing Level {levelId}
                    </h1>
                    <Link href="/">
                        <Button variant="outline" className="text-white">
                            Exit Editor
                        </Button>
                    </Link>
                </div>

                <div 
                    ref={containerRef}
                    className="rounded-lg overflow-hidden shadow-2xl border-4 border-purple-500 aspect-[4/3] w-full bg-black"
                />
                {error && (
                    <div className="text-red-500 text-center mt-4">
                        Error: {error}
                    </div>
                )}
            </div>
        </div>
    );
} 