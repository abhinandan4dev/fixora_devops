import React from 'react';
import { RunStatusResponse } from '../api';
import { motion } from 'framer-motion';

interface DashboardProps {
    status: RunStatusResponse;
}

export const Dashboard: React.FC<DashboardProps> = ({ status }) => {
    const isRunning = status.status === 'RUNNING' || status.status === 'QUEUED';
    const isPassed = status.status === 'PASSED';
    const isFailed = status.status === 'FAILED' || status.status === 'ERROR';

    return (
        <div className="space-y-6 animate-in fade-in duration-500 w-full max-w-6xl mx-auto">
            {/* Summary Card */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-3xl p-8 relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-50"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-8 w-full">
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TARGET SYSTEM</p>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-slate-500 text-lg">dns</span>
                                <p className="text-sm font-mono text-white truncate max-w-[180px]" title={status.repo_url}>
                                    {status.repo_url.replace('https://github.com/', '')}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ACTIVE BRANCH</p>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-lg">call_split</span>
                                <p className="text-sm font-mono text-white truncate max-w-[180px]" title={status.branch_name}>
                                    {status.branch_name || 'INITIALIZING...'}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ANOMALIES DETECTED</p>
                            <p className={`text-2xl font-mono font-bold ${status.failures_detected > 0 ? 'text-red-400 text-glow' : 'text-slate-500'}`}>
                                {status.failures_detected.toString().padStart(2, '0')}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PATCHES APPLIED</p>
                            <p className={`text-2xl font-mono font-bold ${status.fixes_applied > 0 ? 'text-green-400 text-glow' : 'text-slate-500'}`}>
                                {status.fixes_applied.toString().padStart(2, '0')}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className={`px-6 py-3 rounded-xl border backdrop-blur-md flex items-center gap-3 ${isPassed ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                isFailed ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                    'bg-primary/10 border-primary/20 text-white'
                            }`}>
                            <span className={`material-symbols-outlined ${isRunning ? 'animate-spin' : ''}`}>
                                {isRunning ? 'sync' : isPassed ? 'check_circle' : 'error'}
                            </span>
                            <span className="font-bold tracking-widest text-sm">{status.status}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 font-mono">
                            ITERATION {status.iterations_used}/{status.retry_limit}
                        </p>
                    </div>
                </div>
            </motion.section>

            <div className="grid lg:grid-cols-12 gap-6 h-[500px]">
                {/* Timeline */}
                <motion.section
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-4 glass-panel rounded-3xl p-6 flex flex-col h-full"
                >
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">history</span>
                        Execution Timeline
                    </h3>

                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                        <div className="relative flex flex-col gap-6 ml-3 border-l border-white/10 pl-6 py-2">
                            {status.timeline.map((event, idx) => (
                                <div key={idx} className="relative group">
                                    <div className={`absolute -left-[29px] top-1 h-3 w-3 rounded-full border border-dark-bg ${event.status === 'PASS' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-secondary shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                                        }`}></div>
                                    <div className="bg-white/5 p-3 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">CYCLE {event.iteration}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">{event.timestamp === 'now' ? 'JUST NOW' : event.timestamp}</span>
                                        </div>
                                        <p className={`font-medium text-sm ${event.status === 'PASS' ? 'text-green-400' : 'text-secondary'}`}>
                                            {event.status === 'PASS' ? 'Diagnostics Passed' : 'Anomalies Detected'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {status.timeline.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-40 text-slate-600">
                                    <span className="material-symbols-outlined mb-2 text-2xl opacity-50">pending</span>
                                    <p className="text-xs uppercase tracking-widest">Awaiting Events</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.section>

                <div className="lg:col-span-8 flex flex-col gap-6 h-full">
                    {/* Fixes Table */}
                    <motion.section
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="glass-panel rounded-3xl p-0 flex-1 flex flex-col overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-sm">build</span>
                                Applied Rectifications
                            </h3>
                        </div>
                        <div className="flex-grow overflow-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 sticky top-0 backdrop-blur-md">
                                    <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                        <th className="px-6 py-3 font-medium">Module</th>
                                        <th className="px-6 py-3 font-medium">Classification</th>
                                        <th className="px-6 py-3 text-center font-medium">Vector</th>
                                        <th className="px-6 py-3 font-medium">Modification</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {status.fixes.map((fix, idx) => (
                                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-3 text-xs font-mono text-slate-300 group-hover:text-white transition-colors">{fix.file}</td>
                                            <td className="px-6 py-3">
                                                <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded border border-white/5 text-slate-300 font-mono">
                                                    {fix.bug_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-center text-xs font-mono text-slate-500">L:{fix.line_number}</td>
                                            <td className="px-6 py-3 text-xs text-slate-500 font-mono truncate max-w-[200px]" title={fix.commit_message}>
                                                {fix.commit_message}
                                            </td>
                                        </tr>
                                    ))}
                                    {status.fixes.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-600">
                                                <span className="block text-xs uppercase tracking-widest mb-1">No Interventions Required</span>
                                                <span className="text-[10px] text-slate-700">Codebase logic integrity nominal</span>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.section>

                    {/* Logs */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-panel rounded-3xl p-6 h-48 flex flex-col"
                    >
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-sm">terminal</span>
                            System Stream
                        </h3>
                        <div className="flex-grow bg-black/40 rounded-xl p-4 overflow-auto custom-scrollbar border border-white/5">
                            <pre className="text-[10px] text-green-400/80 font-mono leading-relaxed whitespace-pre-wrap">
                                {status.raw_logs || '> Waiting for incoming signal...'}
                            </pre>
                        </div>
                    </motion.section>
                </div>
            </div>
        </div>
    );
};
