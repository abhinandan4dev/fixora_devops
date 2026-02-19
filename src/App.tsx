import { useState, useEffect } from 'react';
import { RunForm } from './components/RunForm';
import { Dashboard } from './components/Dashboard';
import { api, RunStatusResponse } from './api';

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#181121] text-slate-900 dark:text-slate-100 font-sans pb-20">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#181121]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#7d30e8] p-2 rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-2xl">auto_fix_high</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Healing Agent</h1>
            <p className="text-xs text-slate-500 font-medium">Autonomous CI/CD Remediation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full border border-green-800/10">
                <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-600 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                </span>
                <span className="text-xs font-bold text-green-700 dark:text-green-400">SYSTEM OPERATIONAL</span>
            </div>
            {jobId && (
                <button 
                    onClick={() => { setJobId(null); setStatus(null); }}
                    className="text-xs font-bold text-slate-500 hover:text-[#7d30e8]"
                >
                    NEW RUN
                </button>
            )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!jobId ? (
          <RunForm onRunStarted={setJobId} />
        ) : (
          status ? <Dashboard status={status} /> : (
            <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7d30e8]"></div>
                <p className="mt-4 text-slate-500 font-medium">Initializing Agent...</p>
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default App;
