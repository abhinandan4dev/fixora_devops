import { useState, useEffect, useRef, Suspense } from 'react';
import { RunForm } from './components/RunForm';
import { Dashboard } from './components/Dashboard';
import { api, RunStatusResponse } from './api';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import { motion, AnimatePresence } from 'framer-motion';

// --- 3D Background Components ---
function StarField(props: any) {
  const ref = useRef<any>();
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }));

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#8b5cf6"
          size={0.002}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-96 relative z-10 glass-panel rounded-3xl p-10">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-r-4 border-secondary rounded-full animate-spin reverse"></div>
        <div className="absolute inset-4 border-b-4 border-white/50 rounded-full animate-pulse"></div>
      </div>
      <p className="mt-8 text-xl font-medium tracking-wider text-white/80 animate-pulse">
        INITIALIZING AGENT PROTOCOLS...
      </p>
    </div>
  );
}

// --- Main App ---
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
          if (data.status === 'PASSED' || data.status === 'FAILED' || data.status === 'ERROR') {
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
    <div className="relative min-h-screen w-full overflow-hidden bg-dark-bg text-slate-100 font-sans selection:bg-primary/30">

      {/* 3D Background Layer */}
      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 1] }}>
          <Suspense fallback={null}>
            <StarField />
          </Suspense>
        </Canvas>
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Navbar */}
        <nav className="w-full border-b border-white/5 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-black rounded-lg p-2 border border-white/10">
                  <span className="material-symbols-outlined text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    auto_fix_high
                  </span>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  FiXora <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/50 border border-white/5">BSETA v1.0</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-bold text-green-400 tracking-wider">SYSTEM ONLINE</span>
              </div>

              <AnimatePresence>
                {jobId && (
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={() => { setJobId(null); setStatus(null); }}
                    className="text-xs font-bold text-white/40 hover:text-white transition-colors tracking-widest uppercase border-l border-white/10 pl-6"
                  >
                    Reset Protocol
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>

        {/* Main Area */}
        <main className="flex-grow flex flex-col items-center justify-center p-6 w-full max-w-7xl mx-auto">
          <AnimatePresence mode='wait'>
            {!jobId ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="w-full max-w-3xl"
              >
                <div className="text-center mb-12">
                  <h2 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-white/80 to-white/20 mb-6 tracking-tight">
                    Automated Repair
                  </h2>
                  <p className="text-lg text-white/40 max-w-2xl mx-auto font-light leading-relaxed">
                    Deploy autonomous agents to diagnose, test, and fix CI/CD pipeline failures in real-time.
                    Powered by advanced LLM reasoning.
                  </p>
                </div>
                <RunForm onRunStarted={setJobId} />
              </motion.div>
            ) : (
              status ? (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full"
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

        {/* Footer */}
        <footer className="w-full py-6 text-center text-xs text-white/10">
          SECURE CONNECTION ESTABLISHED • NODE ID: {import.meta.env.MODE === 'development' ? 'DEV-LOCAL-01' : 'PROD-EDGE-99'}
        </footer>
      </div>
    </div>
  );
}

export default App;
