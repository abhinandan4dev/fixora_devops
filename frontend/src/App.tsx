import { useState, useEffect } from 'react';
import { RunForm } from './components/RunForm';
import { Dashboard } from './components/Dashboard';
import { api, RunStatusResponse } from './api';
import { motion, AnimatePresence } from 'framer-motion';

// --- Background Mesh Orbs ---
function MeshBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#FAFAFA]">
      {/* Texture / Noise Layer */}
      <div className="noise-overlay" />

      {/* Light subtle grid pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #1e293b 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      {/* Massive glowing blur orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full animate-orb-1 opacity-70"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(80px)' }} />

      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full animate-orb-2 opacity-70"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, rgba(20,184,166,0.08) 50%, rgba(255,255,255,0) 80%)', filter: 'blur(100px)', animationDelay: '-8s' }} />

      <div className="absolute top-[30%] left-[50%] w-[40vw] h-[40vw] rounded-full animate-orb-1 opacity-50"
        style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(100px)', animationDelay: '-15s' }} />
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] relative z-20">
      <div className="relative w-24 h-24 mb-6 drop-shadow-2xl">
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#6366F1] animate-spin" style={{ animationDuration: '1s', filter: 'drop-shadow(0 0 10px rgba(99,102,241,0.5))' }} />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-l-[#EC4899] animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
        <div className="absolute inset-4 rounded-full border-4 border-transparent border-b-[#14B8A6] animate-spin" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-[#6366F1] rounded-full animate-pulse shadow-[0_0_15px_rgba(99,102,241,1)]" />
        </div>
      </div>
      <p className="text-sm font-semibold tracking-[0.25em] text-slate-500 uppercase animate-pulse">
        Assembling Agents...
      </p>
    </div>
  );
}

function App() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<RunStatusResponse | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (jobId) {
      const fetchStatus = async () => {
        try {
          const data = await api.getStatus(jobId);
          setStatus(data);
          if (['PASSED', 'FAILED', 'ERROR', 'FINISHED'].includes(data.status)) {
            clearInterval(interval);
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      };
      fetchStatus();
      interval = setInterval(fetchStatus, 2000);
    }
    return () => clearInterval(interval);
  }, [jobId]);

  return (
    <div className="relative min-h-screen w-full font-sans selection:bg-[#6366F1]/20">

      <MeshBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation */}
        <nav className="w-full fixed top-0 z-50 backdrop-blur-xl bg-white/40 border-b border-white/50 shadow-[0_4px_30px_rgba(0,0,0,0.02)] transition-all">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-[#6366F1] to-[#EC4899] rounded-[14px] blur-sm opacity-40 group-hover:opacity-80 transition-opacity duration-300" />
                <div className="relative bg-white rounded-[14px] p-2 border border-white/80 shadow-sm flex items-center justify-center h-10 w-10">
                  <span className="material-symbols-outlined text-[20px] text-transparent bg-clip-text bg-gradient-to-r from-[#6366F1] to-[#EC4899]">vital_signs</span>
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-slate-900 leading-tight tracking-tight">FiXora</h1>
                <span className="text-[9px] font-extrabold text-[#6366F1] tracking-[0.25em] uppercase leading-none">Intelligence Engine</span>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-white shadow-sm backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                </span>
                <span className="text-[10px] font-bold text-slate-700 tracking-wider">SYSTEM OPTIMAL</span>
              </div>

              <AnimatePresence>
                {jobId && (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={() => { setJobId(null); setStatus(null); }}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest px-4 py-2 rounded-full hover:bg-slate-100/50"
                  >
                    Reset Environment
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>

        {/* Main Viewport */}
        <main className="flex-grow flex flex-col items-center justify-center px-4 w-full pt-28 pb-12">
          <AnimatePresence mode='wait'>
            {!jobId ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
                transition={{ duration: 0.6, type: "spring", bounce: 0.15 }}
                className="w-full max-w-[560px]"
              >
                <div className="text-center mb-10 w-full flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }}
                    className="mb-6 inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-[#6366F1]/20 bg-white/40 shadow-sm backdrop-blur-md gap-2"
                  >
                    <span className="material-symbols-outlined text-[14px] text-[#6366F1]">auto_awesome</span>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-700">Autonomous Healing v1.0</span>
                  </motion.div>

                  <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-5 tracking-tight leading-[1.05]">
                    Self-Repairing<br />
                    <span className="text-gradient">Infrastructure.</span>
                  </h2>
                  <p className="text-[15px] font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Deploy four synchronized AI agents to diagnose, trace, and instantly patch pipeline failures.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#6366F1] via-[#EC4899] to-[#14B8A6] rounded-[2rem] blur-xl opacity-20" />
                  <RunForm onRunStarted={setJobId} />
                </div>

              </motion.div>
            ) : (
              status ? (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-full h-full max-w-[1400px] mx-auto"
                >
                  <Dashboard status={status} />
                </motion.div>
              ) : (
                <motion.div key="loader">
                  <LoadingSpinner />
                </motion.div>
              )
            )}
          </AnimatePresence>
        </main>

        <footer className="w-full py-8 text-center text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
          Powered by Gemini 2.0 Flash Enterprise Engine
        </footer>
      </div>
    </div>
  );
}

export default App;
