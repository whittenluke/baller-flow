"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

export function LevelEditorModal() {
    const router = useRouter();
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    
    const levels = Array.from({ length: 10 }, (_, i) => ({
        number: i + 1,
        name: `Level ${i + 1}`,
        description: `Edit Level ${i + 1} design and layout`
    }));

    const handleEditClick = (levelNumber: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering the div's onClick
        router.push(`/editor/${levelNumber}`);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                    Level Editor
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] bg-gradient-to-br from-purple-900 to-black">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-white mb-4">
                        Level Editor
                    </DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                    {levels.map((level) => (
                        <div
                            key={level.number}
                            className={`
                                p-4 rounded-lg border-2 cursor-pointer transition-all
                                ${selectedLevel === level.number 
                                    ? 'border-purple-500 bg-purple-900/50' 
                                    : 'border-purple-700/50 bg-black/50 hover:border-purple-600'}
                            `}
                            onClick={() => setSelectedLevel(level.number)}
                        >
                            <h3 className="text-xl font-bold text-white mb-2">
                                {level.name}
                            </h3>
                            <p className="text-purple-200 text-sm">
                                {level.description}
                            </p>
                            
                            <div className="mt-4 flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                    onClick={(e) => handleEditClick(level.number, e)}
                                >
                                    Edit
                                </Button>
                                <Link 
                                    href={`/game?level=${level.number}`}
                                    className="w-full"
                                >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Play
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
} 