import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldAlert, Settings, LoaderCircle, TriangleAlert,
  Hexagon, Play, MessageSquare, Clipboard, Briefcase, Bomb, Power 
} from 'lucide-react';
import SocialGraph from './SocialGraph';
import ReactMarkdown from 'react-markdown';
import SplashScreen from './SplashScreen'; 

const getFactionColor = (faction) => {
  if (faction === 'Western') return '#00d4ff';
  if (faction === 'Eastern') return '#ff003c';
  if (faction === 'Middle East') return '#00ff9d';
  return '#b026ff';
};

function App() {
  // --- STATE ---
  const [showSplash, setShowSplash] = useState(true);
  const [command, setCommand] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedAction, setSelectedAction] = useState('WHISPER');
  const [attackTarget, setAttackTarget] = useState('Oil Refinery');
  const [innerMonologue, setInnerMonologue] = useState('');
  const [interceptType, setInterceptType] = useState('');
  const [recentLogs, setRecentLogs] = useState([
    { time: '00:00:00', text: 'System Initialized. Shadow Network Online.' }
  ]);

  // --- LOGGING ---
  const addLog = (text) => {
    const timeString = new Date().toLocaleTimeString('en-US', { hour12: false });
    setRecentLogs(prev => [{ time: timeString, text }, ...prev].slice(0, 6));
  };

  // --- API FETCHING ---
  const fetchGraph = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/graph');
      const data = await response.json();
      setGraphData(data);
      if (!selectedAgent && data.nodes.length > 0) {
        setSelectedAgent(data.nodes[0]);
      }
    } catch (error) { 
      console.error("Neo4j fetch failed:", error); 
    }
  };

  useEffect(() => {
    fetchGraph();
    const interval = setInterval(fetchGraph, 10000);
    return () => clearInterval(interval);
  }, []);

  // --- OPERATIONS ---
  const handleMasterExecute = () => {
    if (selectedAction === 'WHISPER') handleWhisper();
    if (selectedAction === 'ATTACK') handleSabotage();
  };

  const handleWhisper = async () => {
    if (!command || !selectedAgent) return;
    setIsSending(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/ops/whisper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          source_country: 'Unknown Proxy', 
          target_country: selectedAgent.id, 
          message: command 
        })
      });
      const data = await response.json();
      setInnerMonologue(`[${selectedAgent.name.toUpperCase()}]: \n\n${data.action_taken}`);
      setInterceptType('HUMAN WHISPER'); 
      addLog(`Secret message sent to ${selectedAgent.name}`);
      setCommand(''); 
    } catch (error) { console.error(error); }
    setIsSending(false);
  };

  const handleSabotage = async () => {
    if (!selectedAgent) return;
    setIsSending(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/ops/sabotage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country_id: selectedAgent.id, specific_target: attackTarget })
      });
      if (!response.ok) {
        if (response.status === 429) addLog(`ATTACK FAILED: ${selectedAgent.name} defenses too strong.`);
      } else {
        const data = await response.json();
        setInnerMonologue(`[SYSTEM ALERT]: \n\n${data.message}`);
        setInterceptType('COVERT SABOTAGE');
        addLog(`SUCCESS: Secret attack on ${selectedAgent.name} - ${attackTarget} offline.`);
        fetchGraph(); 
      }
    } catch (error) { console.error(error); }
    setIsSending(false);
  };

  const handleGlobalReset = async () => {
    setIsSending(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/ops/reset', { method: 'POST' });
      if (response.ok) {
        setInnerMonologue(`[SYSTEM ALERT]: \n\nGlobal timeline reset initiated. Board wiped.`);
        setInterceptType('SYSTEM OVERRIDE');
        addLog(`SYSTEM ALERT: Global timeline reset initiated.`);
        setSelectedAgent(null);
        fetchGraph();
      }
    } catch (error) { console.error("Reset failed:", error); }
    setIsSending(false);
  };

  // --- AUTO CHATTER ---
  useEffect(() => {
    let interval;
    if (isAutoRunning) {
      interval = setInterval(async () => {
        try {
          const response = await fetch('http://127.0.0.1:8000/ops/auto', { method: 'POST' });
          const data = await response.json();
          if (data.status === 'success') {
            setInnerMonologue(`[${data.target.toUpperCase()}]: \n\n${data.action_taken}`);
            setInterceptType('AGENTIC WHISPER');
            addLog(`[AUTO] ${data.source} intel intercepted regarding ${data.target}`);
          }
        } catch (error) { console.error("Auto chatter failed:", error); }
      }, 45000); 
    }
    return () => clearInterval(interval);
  }, [isAutoRunning]);

  return (
    <div className="h-screen w-screen bg-[#02050A] text-cyan-100 flex flex-col overflow-hidden relative font-sans">
      
      {/* SPLASH SCREEN COMPONENT */}
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}

      {/* HEADER */}
      <header className="h-14 border-b border-cyan-900/50 bg-[#030712] flex items-center justify-center px-6 z-0 shrink-0 shadow-[0_4px_20px_rgba(8,145,178,0.1)]">
          <h1 className="text-2xl font-serif font-bold tracking-[0.3em] text-cyan-400" style={{ textShadow: '0 0 15px rgba(34,211,238,0.6)'}}>
            EMPIRE OF SHADOWS
          </h1>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col gap-4 p-4 overflow-hidden z-0">
        <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
          
          {/* LEFT: SHADOW AGENTS */}
          <section className="col-span-2 flex flex-col bg-[#050A15] border border-cyan-900/40 rounded-lg overflow-hidden relative shadow-[inset_0_0_20px_rgba(8,145,178,0.05)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
            <div className="flex justify-between items-center px-4 py-4 border-b border-cyan-900/40 shrink-0">
              <h2 className="text-sm text-cyan-400 tracking-widest font-serif uppercase">Shadow Agents</h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {graphData.nodes.map((node) => {
                const isSelected = selectedAgent?.id === node.id;
                const factionColor = getFactionColor(node.faction);
                return (
                  <div key={node.id} onClick={() => setSelectedAgent(node)} className={`cursor-pointer transition-all flex items-center justify-between py-3 px-3 rounded mb-1 group ${isSelected ? 'bg-cyan-900/20 border border-cyan-500/50 shadow-[0_0_15px_rgba(8,145,178,0.2)]' : 'bg-transparent border border-transparent hover:bg-cyan-950/30'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: factionColor, boxShadow: `0 0 8px ${factionColor}, 0 0 12px ${factionColor}` }}></div>
                      <span className={`font-semibold tracking-wider text-[12px] truncate ${isSelected ? 'text-cyan-100' : 'text-cyan-500 group-hover:text-cyan-300'}`}>{node.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* CENTER: TACTICAL MAP */}
          <section className="col-span-8 flex flex-col bg-[#050A15] border border-cyan-900/40 rounded-lg overflow-hidden relative shadow-[0_0_30px_rgba(8,145,178,0.05)]">
            <h2 className="absolute top-4 left-5 z-10 text-[11px] text-cyan-400/80 font-mono font-bold tracking-[0.2em] uppercase pointer-events-none">
              <span className="inline-block w-2 h-2 bg-cyan-500 animate-pulse mr-2 rounded-sm"></span> GLOBAL TACTICAL VIEW
            </h2>
            <div className="flex-1 w-full h-full relative flex items-center justify-center overflow-hidden">
              <SocialGraph graphData={graphData} />
            </div>
          </section>

          {/* RIGHT: WHISPER CHAMBER */}
          <section className="col-span-2 flex flex-col bg-[#050A15] border border-cyan-900/40 rounded-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl pointer-events-none"></div>
            <div className="px-4 py-4 border-b border-cyan-900/40 shrink-0">
              <h2 className="text-sm text-cyan-400 tracking-widest font-serif uppercase">WHISPER CHAMBER</h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
               {interceptType && <h3 className="text-xs font-serif tracking-widest text-cyan-200 uppercase mb-4 border-b border-cyan-900/40 pb-2">{interceptType}</h3>}
              <div className={`text-[11px] border-l-[3px] pl-3 py-1 font-mono leading-relaxed ${isAutoRunning && interceptType === 'AGENTIC WHISPER' ? 'border-green-500/50 text-green-100/90 [&_strong]:text-green-300' : 'border-cyan-500/50 text-cyan-100/90 [&_strong]:text-cyan-300'}`}>
                <ReactMarkdown>{innerMonologue}</ReactMarkdown>
              </div>
              {isSending && <div className="mt-4 flex items-center gap-2 text-[10px] text-cyan-600 font-mono animate-pulse"><LoaderCircle size={10} className="animate-spin" /> SYNCING...</div>}
            </div>
          </section>
        </div>

        {/* BOTTOM SECTION: SHADOW CORNER */}
        <div className="h-[26vh] min-h-[220px] shrink-0 grid grid-cols-12 gap-4">
          
          {/* ACTION TOGGLES */}
          <section className="col-span-2 flex flex-col bg-[#050A15] border border-cyan-900/40 rounded-lg p-3 relative">
             <h2 className="text-[10px] text-cyan-500 mb-2 font-mono uppercase tracking-[0.2em] border-b border-cyan-900/40 pb-2">OPERATIONS</h2>
             <div className="grid grid-cols-2 gap-2 flex-1">
                {['WHISPER', 'ATTACK'].map((action) => {
                  const isActive = selectedAction === action;
                  const Icon = action === 'WHISPER' ? MessageSquare : Bomb;
                  return (
                    <button key={action} onClick={() => setSelectedAction(action)} className={`flex flex-col items-center justify-center p-1 border transition-all ${isActive ? 'border-cyan-400 bg-cyan-900/20 shadow-[inset_0_0_15px_rgba(34,211,238,0.15)] text-cyan-300' : 'border-cyan-900/40 bg-[#030712] hover:border-cyan-700 text-cyan-700'}`}>
                      <Icon size={14} className="mb-1" />
                      <span className="text-[8px] font-mono tracking-widest uppercase">{action}</span>
                    </button>
                  );
                })}
             </div>
             <div className="mt-2 pt-2 border-t border-cyan-900/40 shrink-0 flex flex-col gap-2">
                <button onClick={() => setIsAutoRunning(!isAutoRunning)} className={`w-full border p-2 rounded-sm text-[9px] font-mono tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${isAutoRunning ? 'border-green-500 bg-green-900/20 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'border-cyan-900/40 bg-[#030712] text-cyan-600 hover:border-cyan-600'}`}><Power size={12} /> Auto Whisper: {isAutoRunning ? 'ON' : 'OFF'}</button>
                <button onClick={handleGlobalReset} className="w-full border p-2 rounded-sm text-[9px] font-mono tracking-widest uppercase border-fuchsia-900/40 text-fuchsia-600 hover:border-fuchsia-500 hover:bg-fuchsia-900/10 flex items-center justify-center gap-2 transition-all"><ShieldAlert size={12} /> Global Reset</button>
             </div>
          </section>

          {/* MASTER EXECUTION PANEL */}
          <section className="col-span-10 flex flex-col bg-[#050A15] border border-cyan-900/40 rounded-lg p-5 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-cyan-500/20 blur-md pointer-events-none"></div>
            <div className="flex justify-between items-end mb-4 shrink-0">
              <h2 className="text-xl text-cyan-400 font-serif uppercase tracking-[0.15em]">Shadow Corner</h2>
              <div className="text-right">
                <div className="text-[9px] text-cyan-600 font-mono uppercase tracking-widest mb-1">Target Status</div>
                <div className="text-xs text-cyan-300 font-mono">{isSending ? "Executing Protocol..." : (selectedAgent ? `Locked: ${selectedAgent.name}` : "Awaiting Selection.")}</div>
              </div>
            </div>

            <div className="flex gap-4 mb-4 shrink-0 h-14">
              {selectedAction === 'WHISPER' ? (
                <div className="flex-1 relative h-full">
                  <input type="text" value={command} onChange={(e) => setCommand(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleMasterExecute()} disabled={!selectedAgent} className="w-full h-full bg-[#02040A] border border-cyan-800/40 rounded-sm px-4 text-sm text-cyan-100 focus:outline-none focus:border-cyan-400 font-mono disabled:opacity-50 transition-colors" placeholder={selectedAgent ? `Write a secret message to ${selectedAgent.name}...` : "Select a target"} />
                </div>
              ) : (
                <div className="flex-1 flex gap-4 items-center bg-[#02040A] border border-cyan-800/40 rounded-sm px-4">
                  <span className="text-[11px] text-cyan-600 font-mono uppercase whitespace-nowrap">Target Sector:</span>
                  <select value={attackTarget} onChange={(e) => setAttackTarget(e.target.value)} className="flex-1 bg-transparent text-cyan-100 text-sm font-mono focus:outline-none cursor-pointer">
                    <option value="Oil Refinery" className="bg-[#050A15]">Oil Refinery</option>
                    <option value="Power Grid" className="bg-[#050A15]">Main Power Grid</option>
                    <option value="Data Center" className="bg-[#050A15]">National Data Center</option>
                    <option value="Water Supply" className="bg-[#050A15]">Water Supply System</option>
                    <option value="Port Terminal" className="bg-[#050A15]">Major Port Terminal</option>
                  </select>
                </div>
              )}
              
              <button onClick={handleMasterExecute} disabled={isSending || !selectedAgent} className="h-full bg-[#0A0515] border border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.2)] hover:shadow-[0_0_25px_rgba(217,70,239,0.5)] hover:bg-[#120525] text-fuchsia-400 px-8 font-serif tracking-[0.15em] text-sm flex items-center justify-between gap-6 transition-all min-w-[320px] rounded-sm disabled:opacity-40">
                <div className="flex items-center gap-3">
                  <Hexagon size={16} className="text-fuchsia-500" />
                  <span className="mt-0.5">{selectedAction === 'ATTACK' ? `Do a secret attack on ${selectedAgent?.name || 'Target'}` : 'EXECUTE'}</span>
                </div>
                <Play size={14} fill="currentColor" className="text-fuchsia-500" />
              </button>
            </div>

            {/* OPERATION LEDGER */}
            <div className="flex-1 flex flex-col min-h-0">
              <h2 className="text-[9px] text-cyan-600 mb-2 font-mono tracking-widest uppercase flex items-center gap-2 shrink-0">
                <span className="w-4 h-[1px] bg-cyan-900/50"></span> Operation Ledger <span className="flex-1 h-[1px] bg-cyan-900/50"></span>
              </h2>
              <ul className="text-[11px] font-mono space-y-1.5 overflow-y-auto custom-scrollbar pr-2 flex-1">
                {recentLogs.map((log, index) => (
                  <li key={index} className="flex justify-between items-start text-cyan-600/80 leading-tight">
                    <span><span className={log.text.includes('SUCCESS') ? 'text-fuchsia-500' : log.text.includes('[AUTO]') ? 'text-green-500' : 'text-cyan-500'}>{log.time}</span> <span className="text-cyan-200/70">{log.text}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;