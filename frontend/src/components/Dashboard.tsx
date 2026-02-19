import React, { useState, useEffect, useRef } from 'react';
import { RunStatusResponse } from '../api';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardProps { status: RunStatusResponse; }

const BUG_STYLES: Record<string, { badge: string; text: string }> = {
    LINTING: { badge: 'bg-amber-100/50 border-amber-200', text: 'text-amber-700' },
    SYNTAX: { badge: 'bg-[#EC4899]/10 border-[#EC4899]/20', text: 'text-[#EC4899]' },
    LOGIC: { badge: 'bg-[#6366F1]/10 border-[#6366F1]/20', text: 'text-[#6366F1]' },
    TYPE_ERROR: { badge: 'bg-[#F97316]/10 border-[#F97316]/20', text: 'text-[#F97316]' },
    IMPORT: { badge: 'bg-[#4338CA]/10 border-[#4338CA]/20', text: 'text-[#4338CA]' },
    INDENTATION: { badge: 'bg-[#14B8A6]/10 border-[#14B8A6]/20', text: 'text-[#14B8A6]' },
};

const AGENTS = [
    { icon: 'share_windows', label: 'Trace', color: 'bg-[#6366F1]' },
    { icon: 'bug_report', label: 'Parse', color: 'bg-[#EC4899]' },
    { icon: 'healing', label: 'Patch', color: 'bg-[#F97316]' },
    { icon: 'shield_locked', label: 'Verify', color: 'bg-[#14B8A6]' },
];

function getActiveAgent(s: RunStatusResponse): number {
    if (s.status === 'QUEUED') return 0;
    if (s.status === 'RUNNING') return 1;
    if (s.status === 'FIXING') return 2;
    if (s.status === 'PASSED' || s.status === 'FINISHED') return 4;
    return 1;
}

function formatPS3(f: { file: string; bug_type: string; line_number: number; commit_message: string }): string {
    const i = f.commit_message.indexOf('\u2192');
    let desc = 'anomaly resolved by agent';
    if (i >= 0) { desc = f.commit_message.substring(i + 1).trim().replace(/^(Fix:|Fixed:|Annotated:)\s*/i, '').trim(); }
    return `${f.bug_type} error in ${f.file} line ${f.line_number} \u2192 Fix: ${desc}`;
}

function cleanLogs(r: string): string {
    return r.split('\n').filter(l => !l.includes('WARNING: Running pip') && !l.includes('[notice]') && !l.includes('To update, run:') && l.trim()).join('\n');
}

function formatTime(s: number): string {
    if (s <= 0) return '--:--';
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

function AnimNum({ value }: { value: number }) {
    const [d, setD] = useState(0);
    useEffect(() => {
        const start = Date.now();
        const tick = () => {
            const p = Math.min((Date.now() - start) / 1000, 1);
            setD(Math.floor((1 - Math.pow(1 - p, 4)) * value));
            if (p < 1) requestAnimationFrame(tick);
        };
        tick();
    }, [value]);
    return <>{d}</>;
}

export const Dashboard: React.FC<DashboardProps> = ({ status }) => {
    const isRunning = ['RUNNING', 'QUEUED', 'FIXING'].includes(status.status);
    const isPassed = status.status === 'PASSED';
    const isFinished = status.status === 'FINISHED';
    const isFailed = status.status === 'FAILED' || status.status === 'ERROR';
    const isDone = !isRunning;

    let baseScore = 100;
    const items: { label: string; val: string; c: string }[] = [{ label: 'Baseline', val: '100', c: 'text-slate-800' }];
    if (status.total_time_seconds > 0 && status.total_time_seconds < 300) { baseScore += 10; items.push({ label: 'Velocity Bonus', val: '+10', c: 'text-[#14B8A6]' }); }
    if (status.fixes.length > 20) { const p = (status.fixes.length - 20) * 2; baseScore -= p; items.push({ label: 'Commit Overhead', val: `-${p}`, c: 'text-[#EC4899]' }); }
    const finalScore = Math.max(0, Math.min(110, baseScore));

    const active = getActiveAgent(status);
    const logsEnd = useRef<HTMLDivElement>(null);
    const [tab, setTab] = useState<'fixes' | 'logs'>('fixes');

    useEffect(() => { logsEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [status.raw_logs]);

    const logLines = cleanLogs(status.raw_logs).split('\n').filter(Boolean);

    return (
        <div className="space-y-6 w-full pb-20 mt-4 relative z-20">

            {/* PIPELINE HEADER */}
            <motion.section initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 150 }} className="glass-card rounded-[2rem] p-6 lg:p-10 w-full backdrop-blur-[40px]">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">

                    <div className="flex-1 w-full relative">
                        <div className="flex items-center justify-between z-10 relative">
                            {AGENTS.map((agent, idx) => {
                                const done = idx < active;
                                const current = idx === active - 1 && isRunning;
                                return (
                                    <React.Fragment key={idx}>
                                        <div className="flex flex-col items-center gap-3 relative bg-white/50 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-white/80">
                                            {current && (
                                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                                    className="absolute -inset-1 rounded-[1.2rem] border-[1.5px] border-dashed border-[#6366F1]/50 pointer-events-none" />
                                            )}
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-700 ${done ? 'bg-[#14B8A6] shadow-[0_4px_15px_rgba(20,184,166,0.3)]' :
                                                current ? `${agent.color} shadow-[0_8px_25px_rgba(99,102,241,0.5)]` :
                                                    'bg-slate-100 shadow-inner'
                                                }`}>
                                                <span className={`material-symbols-outlined text-[24px] ${done || current ? 'text-white' : 'text-slate-400'}`}>
                                                    {done ? 'task_alt' : agent.icon}
                                                </span>
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${done ? 'text-[#14B8A6]' : current ? 'text-[#6366F1]' : 'text-slate-400'}`}>
                                                {agent.label}
                                            </span>
                                        </div>
                                        {idx < AGENTS.length - 1 && (
                                            <div className="flex-1 h-1.5 mx-2 lg:mx-4 bg-slate-200/50 rounded-full overflow-hidden shadow-inner relative">
                                                {(done || current) && (
                                                    <motion.div
                                                        initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.8 }}
                                                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${done ? 'from-[#6366F1] to-[#14B8A6]' : 'from-[#6366F1] to-[#EC4899]'
                                                            }`}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    <div className="h-20 w-px bg-slate-200 hidden lg:block" />

                    <div className="flex flex-col items-center flex-shrink-0 min-w-[200px]">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={`px-6 py-2.5 rounded-full border shadow-sm font-black text-xs tracking-widest uppercase flex items-center gap-2 ${isPassed ? 'bg-[#14B8A6]/10 border-[#14B8A6]/20 text-[#14B8A6]' :
                            isFinished ? 'bg-[#6366F1]/10 border-[#6366F1]/20 text-[#6366F1]' :
                                isFailed ? 'bg-[#EC4899]/10 border-[#EC4899]/20 text-[#EC4899]' :
                                    'bg-[#6366F1] border-transparent text-white shadow-lg shadow-[#6366F1]/30'
                            }`}>
                            {isRunning && <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>}
                            <span>{status.status}</span>
                        </motion.div>

                        {!isRunning && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => {
                                    const blob = new Blob([JSON.stringify(status, null, 2)], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `fixora-report-${status.job_id.slice(0, 8)}.json`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                                className="px-5 py-2.5 rounded-full bg-white/60 border border-slate-200 text-slate-700 font-black text-[10px] tracking-widest uppercase flex items-center gap-2 hover:bg-[#6366F1] hover:text-white hover:border-[#6366F1] transition-all shadow-sm mt-4"
                            >
                                <span className="material-symbols-outlined text-sm">download</span>
                                <span>Download Report</span>
                            </motion.button>
                        )}
                        <span className="text-[10px] font-extrabold text-slate-400 mt-2 tracking-[0.2em] uppercase">SYSTEM STATE</span>
                    </div>

                </div>
            </motion.section>

            {/* METRICS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { l: 'Repository Target', v: status.repo_url.replace('https://github.com/', ''), i: 'hub', col: 'md:col-span-2' },
                    { l: 'Detected Anomalies', v: status.failures_detected, i: 'radar', c: status.failures_detected > 0 ? 'text-[#EC4899]' : 'text-slate-600', big: true },
                    { l: 'Patches Applied', v: status.fixes_applied, i: 'auto_fix_normal', c: status.fixes_applied > 0 ? 'text-[#14B8A6]' : 'text-slate-600', big: true },
                    { l: 'Time Elapsed', v: formatTime(status.total_time_seconds), i: 'pace', mono: true },
                ].map((s, i) => (
                    <motion.div key={s.l} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + (i * 0.05) }} className={`glass-card rounded-[1.5rem] p-5 flex flex-col justify-between ${s.col || ''}`}>
                        <div className="flex items-center gap-2 mb-3 opacity-60">
                            <span className="material-symbols-outlined text-[16px]">{s.i}</span>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{s.l}</span>
                        </div>
                        <span className={`${s.big ? 'text-3xl font-black tabular-nums' : 'text-base font-semibold'} ${s.mono ? 'font-mono text-slate-600' : ''} ${s.c || 'text-slate-800'} truncate w-full`}>
                            {s.big ? <AnimNum value={Number(s.v)} /> : s.v}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* DATA GRID */}
            <div className="grid lg:grid-cols-4 gap-6">

                {/* Score Panel */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-1 glass-card rounded-[1.5rem] p-6 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Agent Performance</span>
                        <span className="material-symbols-outlined text-slate-300">workspace_premium</span>
                    </div>

                    <div className="relative w-full aspect-square max-w-[200px] mx-auto flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-xl" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="48" stroke="rgba(255,255,255,0.6)" strokeWidth="6" fill="transparent" />
                            <circle cx="60" cy="60" r="48" stroke="url(#scoreGrad)" strokeWidth="6" fill="transparent" strokeDasharray={`${(isDone ? finalScore / 110 : 0) * 301} 301`} strokeLinecap="round" className="transition-all duration-1000 ease-in-out" />
                            <defs>
                                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#6366F1" />
                                    <stop offset="50%" stopColor="#EC4899" />
                                    <stop offset="100%" stopColor="#14B8A6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-black text-slate-800 tabular-nums tracking-tighter">{isDone ? <AnimNum value={finalScore} /> : '--'}</span>
                            <span className="text-[10px] font-extrabold text-[#6366F1] tracking-widest uppercase">/110 PTS</span>
                        </div>
                    </div>

                    {isDone && (
                        <div className="space-y-2 pt-4 border-t border-slate-200">
                            {items.map((it, i) => (
                                <div key={i} className="flex justify-between items-center bg-white/50 backdrop-blur-md px-3 py-2 rounded-lg">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{it.label}</span>
                                    <span className={`text-[11px] font-black tracking-widest ${it.c}`}>{it.val}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Console / Tabs */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-3 glass-card rounded-[1.5rem] overflow-hidden flex flex-col min-h-[500px] bg-white/40 shadow-xl border-white/60">

                    <div className="flex bg-slate-100/50 border-b border-slate-200/60 p-2 gap-2 backdrop-blur-md">
                        {(['fixes', 'logs'] as const).map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl transition-all relative ${tab === t ? 'bg-white shadow-md text-[#6366F1] scale-[1.02]' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                    }`}>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">{t === 'fixes' ? 'data_object' : 'terminal'}</span>
                                    {t === 'fixes' ? `Fix Ledger (${status.fixes.length})` : 'Telemetry Stream'}
                                </div>
                                {tab === t && <motion.div layoutId="tab-active" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#6366F1] rounded-full" />}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {tab === 'fixes' ? (
                            <motion.div key="fixes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 overflow-auto p-5 custom-scrollbar">
                                <table className="w-full text-left border-separate border-spacing-y-3">
                                    <thead>
                                        <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em]">
                                            <th className="px-4 pb-1">Anatomy</th>
                                            <th className="px-4 pb-1">Vector</th>
                                            <th className="px-4 pb-1 text-center">Loc</th>
                                            <th className="px-4 pb-1 w-1/2">Resolution Result</th>
                                            <th className="px-4 pb-1 text-right">Integrity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {status.fixes.map((fix, i) => {
                                            const s = BUG_STYLES[fix.bug_type] || BUG_STYLES.LOGIC;
                                            const isAiFix = fix.status === 'AI_FIXED';
                                            return (
                                                <motion.tr key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                                    className="bg-white/90 hover:bg-white transition-all shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-white/80 group rounded-2xl">
                                                    <td className="px-4 py-5 rounded-l-2xl text-[12px] font-mono font-bold text-slate-700">{fix.file}</td>
                                                    <td className="px-4 py-5">
                                                        <span className={`text-[9px] px-3 py-1 rounded-full border shadow-inner font-black tracking-widest ${s.badge} ${s.text}`}>
                                                            {fix.bug_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-5 text-center text-[11px] font-mono font-black text-slate-300">L{fix.line_number}</td>
                                                    <td className="px-4 py-5 font-mono">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[11px] font-bold text-slate-600 line-clamp-1 opacity-90 group-hover:opacity-100 transition-opacity" title={formatPS3(fix)}>{formatPS3(fix)}</span>
                                                            {!isAiFix && <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">warning</span> fallback: documentation applied</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-5 rounded-r-2xl text-right">
                                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${isAiFix ? 'bg-teal-50 border-teal-100 text-[#14B8A6]' : 'bg-amber-50 border-amber-100 text-amber-600'
                                                            }`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${isAiFix ? 'bg-[#14B8A6] animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.5)]' : 'bg-amber-400'}`} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                                {isAiFix ? 'AI REPAIRED' : 'ANNOTATED'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                        {status.fixes.length === 0 && (
                                            <tr><td colSpan={5} className="py-24 text-center">
                                                <div className="relative inline-block mb-4">
                                                    <span className="material-symbols-outlined text-5xl text-slate-200">{isRunning ? 'radar' : 'verified'}</span>
                                                    {isRunning && <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -inset-4 bg-[#6366F1]/10 rounded-full" />}
                                                </div>
                                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">{isRunning ? 'Analyzing Neural Patterns...' : 'Infrastructure is Verified Optimal'}</p>
                                            </td></tr>
                                        )}
                                    </tbody>
                                </table>

                                {isDone && (
                                    <div className="mt-8 flex justify-center">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                const blob = new Blob([JSON.stringify(status, null, 2)], { type: 'application/json' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `fixora-report-${status.job_id.slice(0, 8)}.json`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            }}
                                            className="px-8 py-4 rounded-2xl bg-slate-900 text-white font-black text-xs tracking-[0.25em] uppercase flex items-center gap-3 shadow-2xl shadow-slate-900/40 border border-slate-700 hover:bg-slate-800 transition-all group"
                                        >
                                            <span className="material-symbols-outlined group-hover:translate-y-1 transition-transform">download</span>
                                            DOWNLOAD FINAL EXECUTION REVENUE
                                        </motion.button>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex-1 overflow-auto bg-[#0d1117] p-8 text-[12px] font-mono rounded-b-[1.5rem] custom-scrollbar selection:bg-[#6366F1]/40 border-t border-white/5">
                                <div className="space-y-2">
                                    {logLines.map((line, i) => {
                                        let c = 'text-[#8b949e]';
                                        if (line.includes('FAILED') || line.includes('Error')) c = 'text-[#ff7b72]';
                                        else if (line.includes('PASS') || line.includes('OK')) c = 'text-[#7ee787]';
                                        else if (line.includes('WARNING') || line.includes('Iteration')) c = 'text-[#ffa657]';
                                        else if (line.includes('Agent') || line.includes('Resolved')) c = 'text-[#d2a8ff]';
                                        return (
                                            <div key={i} className={`flex items-start gap-4 leading-relaxed tracking-tight break-all ${c} hover:bg-white/5 px-2 py-0.5 rounded transition-colors group`}>
                                                <span className="text-[#484f58] select-none text-right w-10 shrink-0 font-bold opacity-50 group-hover:opacity-100 transition-opacity">{(i + 1)}</span>
                                                <span className="flex-1">{line}</span>
                                            </div>
                                        );
                                    })}
                                    {logLines.length === 0 && <div className="text-slate-600 animate-pulse flex items-center gap-2 font-black tracking-widest uppercase text-[10px]"><div className="w-2 h-4 bg-[#6366F1]" /> Handshaking Pipeline...</div>}
                                    <div ref={logsEnd} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};
