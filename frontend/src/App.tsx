import { useState, useEffect, useCallback } from 'react';
import { RunForm } from './components/RunForm';
import { Dashboard } from './components/Dashboard';
import { Scene3D } from './components/Scene3D';
import { api, RunStatusResponse } from './api';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Typing Effect Hook ─────────────────────────────────── */
function useTypingEffect(text: string, speed = 60) {
  const [displayText, setDisplayText] = useState('');
  useEffect(() => {
    let i = 0;
    setDisplayText('');
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return displayText;
}

/* ─── Animated Loading ─────────────────────────────────── */
function CyberLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] relative z-20">
      {/* Outer ring */}
      <div className="relative w-32 h-32 mb-8">
        {/* Rotating rings */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-neon-indigo animate-spin"
          style={{ animationDuration: '1s', filter: 'drop-shadow(0 0 15px rgba(129,140,248,0.6))' }} />
        <div className="absolute inset-3 rounded-full border-2 border-transparent border-l-neon-pink animate-spin"
          style={{ animationDuration: '1.5s', animationDirection: 'reverse', filter: 'drop-shadow(0 0 10px rgba(244,114,182,0.4))' }} />
        <div className="absolute inset-6 rounded-full border-2 border-transparent border-b-neon-cyan animate-spin"
          style={{ animationDuration: '2s', filter: 'drop-shadow(0 0 10px rgba(34,211,238,0.4))' }} />
        <div className="absolute inset-9 rounded-full border border-transparent border-r-neon-violet animate-spin"
          style={{ animationDuration: '2.5s', animationDirection: 'reverse' }} />

        {/* Core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-neon-indigo rounded-full animate-pulse"
            style={{ boxShadow: '0 0 20px rgba(129,140,248,0.8), 0 0 40px rgba(129,140,248,0.4)' }} />
        </div>

        {/* Pulsing outer glow */}
        <div className="absolute -inset-4 rounded-full border border-neon-indigo/20 animate-ping"
          style={{ animationDuration: '2s' }} />
      </div>

      {/* Text */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 bg-neon-indigo rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <p className="text-xs font-bold tracking-[0.3em] text-neon-indigo/80 uppercase font-mono">
          Assembling Neural Agents
        </p>
      </div>
    </div>
  );
}

/* ─── Floating Status Badges ────────────────────────────── */
function StatusBadge({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400"
    >
      {children}
    </motion.div>
  );
}

/* ─── Main App ──────────────────────────────────────────── */
function App() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<RunStatusResponse | null>(null);

  const heroText = useTypingEffect('Self-Repairing Infrastructure.', 50);

  const handleReset = useCallback(() => {
    setJobId(null);
    setStatus(null);
  }, []);

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
    <div className="relative min-h-screen w-full font-sans">

      {/* 3D Background Canvas */}
      <Scene3D />

      {/* Scanline overlay */}
      <div className="scanlines" />

      {/* Grid overlay */}
      <div className="grid-overlay" />

      {/* Ambient glow orbs - CSS layer on top of 3D */}
      <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full animate-orb-float opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[45vw] h-[45vw] rounded-full animate-orb-float-reverse opacity-50"
          style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.08) 0%, rgba(34,211,238,0.06) 50%, transparent 80%)', filter: 'blur(100px)' }} />
        <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full animate-orb-float opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)', filter: 'blur(90px)', animationDelay: '-10s' }} />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Navigation */}
        <nav className="w-full fixed top-0 z-50 backdrop-blur-2xl bg-surface-900/60 border-b border-white/[0.04]"
          style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.3)' }}>
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-indigo to-neon-pink rounded-xl blur-md opacity-40 group-hover:opacity-80 transition-opacity duration-500" />
                <div className="relative bg-surface-800 rounded-xl p-2.5 border border-white/[0.08] flex items-center justify-center h-11 w-11"
                  style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                  <span className="material-symbols-outlined text-[22px] text-neon-indigo"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(129,140,248,0.5))' }}>vital_signs</span>
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-black text-white leading-tight tracking-tight">FiXora</h1>
                <span className="text-[9px] font-extrabold text-neon-indigo tracking-[0.3em] uppercase leading-none"
                  style={{ textShadow: '0 0 20px rgba(129,140,248,0.5)' }}>Intelligence Engine</span>
              </div>
            </div>

            <div className="flex items-center gap-5">
              {/* System Status */}
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"
                    style={{ boxShadow: '0 0 10px rgba(52,211,153,0.6)' }} />
                </span>
                <span className="text-[10px] font-bold text-slate-400 tracking-[0.15em] font-mono">SYS::OPTIMAL</span>
              </div>

              {/* Reset button */}
              <AnimatePresence>
                {jobId && (
                  <motion.button
                    initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                    onClick={handleReset}
                    className="text-[10px] font-bold text-slate-500 hover:text-neon-indigo transition-colors uppercase tracking-[0.2em] px-4 py-2 rounded-full hover:bg-neon-indigo/10 border border-transparent hover:border-neon-indigo/20 font-mono cursor-pointer"
                  >
                    ⟨ Reset
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow flex flex-col items-center justify-center px-4 w-full pt-28 pb-12">
          <AnimatePresence mode='wait'>
            {!jobId ? (
              <motion.div
                key="form-view"
                initial={{ opacity: 0, y: 40, filter: 'blur(20px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95, y: -20, filter: 'blur(10px)' }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.1 }}
                className="w-full max-w-[580px]"
              >
                {/* Hero Section */}
                <div className="text-center mb-12 w-full flex flex-col items-center justify-center">
                  {/* Version badge */}
                  <StatusBadge delay={0.2}>
                    <span className="material-symbols-outlined text-[12px] text-neon-indigo"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(129,140,248,0.5))' }}>auto_awesome</span>
                    <span>Autonomous Healing v1.0</span>
                  </StatusBadge>

                  {/* Main heading with typing effect */}
                  <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-[1.05] mt-8">
                    <span className="text-gradient-neon">{heroText}</span>
                    <span className="animate-terminal-blink text-neon-indigo ml-1">|</span>
                  </h2>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8 }}
                    className="text-[15px] font-medium text-slate-400 max-w-md mx-auto leading-relaxed"
                  >
                    Deploy four synchronized AI agents to <span className="text-neon-cyan">diagnose</span>, <span className="text-neon-violet">trace</span>, and <span className="text-neon-pink">instantly patch</span> pipeline failures.
                  </motion.p>

                  {/* Floating feature pills */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.2 }}
                    className="flex flex-wrap justify-center gap-3 mt-8"
                  >
                    {[
                      { icon: 'psychology', label: 'AI Diagnosis', color: 'text-neon-indigo' },
                      { icon: 'healing', label: 'Auto Patch', color: 'text-neon-pink' },
                      { icon: 'verified', label: 'Verify & Push', color: 'text-neon-cyan' },
                    ].map((feat, i) => (
                      <motion.div
                        key={feat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.4 + i * 0.15 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl"
                      >
                        <span className={`material-symbols-outlined text-[14px] ${feat.color}`}>{feat.icon}</span>
                        <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">{feat.label}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                {/* Form container with neon border glow */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="relative"
                >
                  {/* Outer glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-neon-indigo via-neon-pink to-neon-cyan rounded-[2rem] blur-xl opacity-15" />
                  <div className="absolute -inset-[0.5px] bg-gradient-to-r from-neon-indigo via-neon-pink to-neon-cyan rounded-[2rem] opacity-20" />
                  <RunForm onRunStarted={setJobId} />
                </motion.div>
              </motion.div>
            ) : (
              status ? (
                <motion.div
                  key="dashboard-view"
                  initial={{ opacity: 0, y: 30, filter: 'blur(15px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="w-full h-full max-w-[1400px] mx-auto"
                >
                  <Dashboard status={status} />
                </motion.div>
              ) : (
                <motion.div key="loader-view">
                  <CyberLoader />
                </motion.div>
              )
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="w-full py-8 text-center relative z-20">
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/10" />
            <span className="text-[10px] font-bold tracking-[0.3em] text-slate-600 uppercase font-mono">
              Powered by Gemini 2.0 Flash
            </span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/10" />
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
