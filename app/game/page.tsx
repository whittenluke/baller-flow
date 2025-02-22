"use client";

import dynamic from "next/dynamic";

const Game = dynamic(() => import("@/components/Game"), {
  ssr: false,
});

export default function GamePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-8 tracking-wider">BALLER FLOW</h1>
      <Game />
      <div className="mt-4 text-white text-center">
        <p className="mb-2">Controls: ← → or A D to move</p>
        <p>Build your Flow Meter by chaining tricks and avoiding obstacles!</p>
      </div>
    </div>
  );
}