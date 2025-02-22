import Link from "next/link";
import { Rocket } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="flex items-center justify-center mb-8">
          <Rocket className="w-16 h-16 text-purple-400" />
        </div>
        <h1 className="text-6xl font-bold text-white mb-8 tracking-wider">BALLER FLOW</h1>
        <p className="text-xl text-purple-200 mb-12 max-w-2xl mx-auto">
          A high-energy, physics-based arcade game where momentum is everything. Chain tricks, dodge obstacles, and keep your flow meter maxed out!
        </p>
        <Link 
          href="/game" 
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-full text-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          PLAY NOW
        </Link>
      </div>
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full">
        <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
          <h3 className="text-xl font-bold text-purple-300 mb-3">Core Movement</h3>
          <p className="text-gray-300">Master the rhythm of bounces and control your momentum with precision.</p>
        </div>
        <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
          <h3 className="text-xl font-bold text-purple-300 mb-3">Flow Meter</h3>
          <p className="text-gray-300">Keep your flow meter charged by chaining tricks and maintaining speed.</p>
        </div>
        <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
          <h3 className="text-xl font-bold text-purple-300 mb-3">Trick System</h3>
          <p className="text-gray-300">Perform wall-rides, edge bounces, and perfect landings for maximum points.</p>
        </div>
      </div>
    </div>
  );
}