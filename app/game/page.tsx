"use client";

import dynamic from "next/dynamic";

const Game = dynamic(() => import("@/components/Game"), {
  ssr: false,
});

export default function GamePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-wider">BALLER FLOW</h1>
          <p className="text-purple-200">Find your perfect flow</p>
        </div>
        
        <Game />
        
        <div className="text-white text-center">
          <p className="mb-2">Controls: ← → or A D to move</p>
          <p>Build your Flow Meter by chaining tricks and avoiding obstacles!</p>
        </div>
      </div>
    </div>
  );
}