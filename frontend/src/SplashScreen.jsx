import React, { useState, useEffect } from 'react';
import { LoaderCircle, TriangleAlert } from 'lucide-react';

const SplashScreen = ({ onComplete }) => {
  const [fadeSplash, setFadeSplash] = useState(false);
  const [initializationProgress, setInitializationProgress] = useState(0);
  const [log, setLog] = useState(["AWAITING DEPLOYMENT PROTOCOL..."]);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setInitializationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return Math.min(prev + (Math.random() < 0.1 ? 5 : 1), 100);
      });
    }, 40);

    const bootTimer = setTimeout(() => setFadeSplash(true), 4000);
    const hideTimer = setTimeout(() => onComplete(), 5000);

    const logs = [
        "NEURAL UPLINK............. PENDING",
        "AI AGENTS................. WAIT",
        "SHADOW NETWORK............ INITIALIZING",
        "WORLD SIM. KERNEL......... LOADING",
        "INFLUENCE CALCULATOR...... PREPARING",
        "HUMAN INTERFACE........... ACTIVE"
    ];

    logs.forEach((text, index) => {
        setTimeout(() => {
            setLog(prev => [`${text} ${text.includes('ACTIVE') || text.includes('LOADING') ? 'OK' : '...' }`, ...prev]);
        }, 600 + index * 400);
    });

    return () => {
      clearTimeout(bootTimer);
      clearTimeout(hideTimer);
      clearInterval(progressTimer);
    };
  }, [onComplete]);

  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center bg-[#02050A] transition-opacity duration-1000 ${fadeSplash ? 'opacity-0' : 'opacity-100'} font-sans overflow-hidden`}>
      
      {/* CSS-ONLY NEURAL GRID (Replaces the missing PNG) */}
      <div className="absolute inset-0 opacity-20" style={{ 
        backgroundImage: `linear-gradient(#0891b2 1px, transparent 1px), linear-gradient(90deg, #0891b2 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}></div>

      {/* PROJECT BRIEF OVERLAY */}
      <div className="z-10 text-center max-w-2xl px-6">
        <h1 className="text-4xl font-serif font-bold tracking-[0.4em] text-cyan-400 mb-8" style={{ textShadow: '0 0 20px rgba(34,211,238,0.5)' }}>
          EMPIRE OF SHADOWS
        </h1>
        <div className="grid grid-cols-2 gap-6 text-left">
            <div className="p-4 border border-cyan-900/30 bg-[#050A15]/80">
                <h3 className="text-cyan-400 text-[10px] tracking-widest uppercase mb-2">NPC Persistent Memory</h3>
                <p className="text-[11px] text-cyan-100/60 leading-relaxed">AI Agents learn from every operation. They remember past strikes, diplomatic whispers, and evolve their strategies over time.</p>
            </div>
            <div className="p-4 border border-cyan-900/30 bg-[#050A15]/80">
                <h3 className="text-cyan-400 text-[10px] tracking-widest uppercase mb-2">Consequence Simulator</h3>
                <p className="text-[11px] text-cyan-100/60 leading-relaxed">Analyze the fallout of real-world geopolitical scenarios by triggering kinetic strikes or covert signal leaks.</p>
            </div>
        </div>
      </div>

      <section className="absolute top-10 left-10 p-5 bg-[#050A15]/60 border border-cyan-900/40 rounded-lg min-w-[280px] z-10 font-mono text-[11px] text-cyan-600/80 space-y-1.5">
          <h2 className="text-xs text-cyan-400/80 mb-3 font-mono font-bold tracking-[0.2em] uppercase">System Initialization</h2>
          <ul className="space-y-1.5">
              {log.slice(0, 7).map((entry, i) => (
                  <li key={i} className="flex justify-between">
                    <span className={entry.includes('OK') ? 'text-cyan-500' : 'text-cyan-700'}>{entry}</span>
                  </li>
              ))}
          </ul>
      </section>

      <div className="absolute bottom-16 flex items-center gap-2 text-cyan-400 animate-pulse text-sm z-10">
        <LoaderCircle size={16} className="animate-spin" /> INITIALIZING NEURAL UPLINK... {initializationProgress}%
      </div>
    </div>
  );
};

export default SplashScreen;