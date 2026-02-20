import React, { useState, useEffect, useRef } from 'react';
import { RunStatusResponse } from '../api';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardProps { status: RunStatusResponse; }

const BUG_STYLES: Record<string, { badge: string; text: string; glow: string }> = {
    LINTING: { badge: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', glow: 'rgba(245,158,11,0.3)' },
    SYNTAX: { badge: 'bg-neon-pink/10 border-neon-pink/20', text: 'text-neon-pink', glow: 'rgba(244,114,182,0.3)' },
    LOGIC: { badge: 'bg-neon-indigo/10 border-neon-indigo/20', text: 'text-neon-indigo', glow: 'rgba(129,140,248,0.3)' },
    TYPE_ERROR: { badge: 'bg-neon-orange/10 border-neon-orange/20', text: 'text-neon-orange', glow: 'rgba(251,146,60,0.3)' },
    IMPORT: { badge: 'bg-neon-violet/10 border-neon-violet/20', text: 'text-neon-violet', glow: 'rgba(167,139,250,0.3)' },
    INDENTATION: { badge: 'bg-neon-cyan/10 border-neon-cyan/20', text: 'text-neon-cyan', glow: 'rgba(34,211,238,0.3)' },
};

const AGENTS = [
    { icon: 'share_windows', label: 'Trace', color: '#818cf8', bg: 'bg-neon-indigo' },
    { icon: 'bug_report', label: 'Parse', color: '#f472b6', bg: 'bg-neon-pink' },
    { icon: 'healing', label: 'Patch', color: '#fb923c', bg: 'bg-neon-orange' },
    { icon: 'shield_locked', label: 'Verify', color: '#22d3ee', bg: 'bg-neon-cyan' },
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
    const items: { label: string; val: string; c: string }[] = [{ label: 'Baseline', val: '100', c: 'text-slate-300' }];
    if (status.total_time_seconds > 0 && status.total_time_seconds < 300) { baseScore += 10; items.push({ label: 'Velocity Bonus', val: '+10', c: 'text-neon-green' }); }
    if (status.fixes.length > 20) { const p = (status.fixes.length - 20) * 2; baseScore -= p; items.push({ label: 'Commit Overhead', val: `-${p}`, c: 'text-neon-pink' }); }
    const finalScore = Math.max(0, Math.min(110, baseScore));

    const active = getActiveAgent(status);
    const logsEnd = useRef<HTMLDivElement>(null);
    const [tab, setTab] = useState<'fixes' | 'logs'>('fixes');

    useEffect(() => { logsEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [status.raw_logs]);

    const logLines = cleanLogs(status.raw_logs).split('\n').filter(Boolean);

    const statusColor = isPassed ? '#34d399' : isFinished ? '#818cf8' : isFailed ? '#f472b6' : '#818cf8';

    return (
        <div className="space-y-6 w-full pb-20 mt-4 relative z-20">

            {/* ═══════════ PIPELINE HEADER ═══════════ */}
            <motion.section
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 150 }}
                className="holo-card rounded-[2rem] p-6 lg:p-10 w-full"
            >
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">

                    {/* Agent Pipeline */}
                    <div className="flex-1 w-full relative">
                        <div className="flex items-center justify-between z-10 relative">
                            {AGENTS.map((agent, idx) => {
                                const done = idx < active;
                                const current = idx === active - 1 && isRunning;
                                return (
                                    <React.Fragment key={idx}>
                                        <div className="flex flex-col items-center gap-3 relative bg-surface-800/60 backdrop-blur-xl p-3 rounded-2xl border border-white/[0.06]"
                                            style={{ boxShadow: done || current ? `0 0 25px -5px ${agent.color}40` : 'none' }}>
                                            {current && (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                                    className="absolute -inset-1 rounded-[1.2rem] border-[1.5px] border-dashed pointer-events-none"
                                                    style={{ borderColor: `${agent.color}60` }}
                                                />
                                            )}
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-700 ${done ? 'bg-neon-green/20 border border-neon-green/30' :
                                                current ? `${agent.bg}/20 border border-white/10` :
                                                    'bg-surface-700 border border-white/[0.04]'
                                                }`}
                                                style={{
                                                    boxShadow: done ? '0 0 20px -3px rgba(52,211,153,0.4)' :
                                                        current ? `0 0 25px -3px ${agent.color}50` :
                                                            'inset 0 2px 4px rgba(0,0,0,0.3)'
                                                }}>
                                                <span className={`material-symbols-outlined text-[24px] ${done ? 'text-neon-green' : current ? 'text-white' : 'text-slate-600'
                                                    }`}
                                                    style={{ filter: done ? 'drop-shadow(0 0 8px rgba(52,211,153,0.5))' : current ? `drop-shadow(0 0 8px ${agent.color}80)` : 'none' }}>
                                                    {done ? 'task_alt' : agent.icon}
                                                </span>
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] font-mono ${done ? 'text-neon-green' : current ? 'text-white' : 'text-slate-600'
                                                }`}
                                                style={{ textShadow: done ? '0 0 10px rgba(52,211,153,0.5)' : current ? `0 0 10px ${agent.color}80` : 'none' }}>
                                                {agent.label}
                                            </span>
                                        </div>
                                        {idx < AGENTS.length - 1 && (
                                            <div className="flex-1 h-1 mx-2 lg:mx-4 bg-surface-700 rounded-full overflow-hidden relative"
                                                style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)' }}>
                                                {(done || current) && (
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: '100%' }}
                                                        transition={{ duration: 0.8 }}
                                                        className="absolute inset-y-0 left-0"
                                                        style={{
                                                            background: done
                                                                ? 'linear-gradient(to right, #818cf8, #34d399)'
                                                                : `linear-gradient(to right, #818cf8, ${agent.color})`,
                                                            boxShadow: `0 0 10px ${done ? 'rgba(52,211,153,0.4)' : `${agent.color}40`}`
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    <div className="h-16 w-px bg-white/[0.06] hidden lg:block" />

                    {/* Status */}
                    <div className="flex flex-col items-center flex-shrink-0 min-w-[200px] gap-3">
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="px-6 py-2.5 rounded-full border font-black text-xs tracking-[0.2em] uppercase flex items-center gap-2"
                            style={{
                                background: `${statusColor}15`,
                                borderColor: `${statusColor}30`,
                                color: statusColor,
                                boxShadow: isRunning ? `0 0 30px -5px ${statusColor}40` : `0 0 20px -5px ${statusColor}20`
                            }}
                        >
                            {isRunning && <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>}
                            <span className="font-mono">{status.status}</span>
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
                                className="px-5 py-2.5 rounded-full bg-surface-800 border border-white/[0.06] text-slate-400 font-black text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 hover:bg-neon-indigo/20 hover:text-neon-indigo hover:border-neon-indigo/30 transition-all cursor-pointer font-mono"
                                style={{ boxShadow: '0 0 20px -5px rgba(0,0,0,0.3)' }}
                            >
                                <span className="material-symbols-outlined text-sm">download</span>
                                <span>Export Report</span>
                            </motion.button>
                        )}
                        <span className="text-[10px] font-extrabold text-slate-600 tracking-[0.25em] uppercase font-mono">System State</span>
                    </div>

                </div>
            </motion.section>

            {/* ═══════════ AI NOTIFICATIONS ═══════════ */}
            <AnimatePresence>
                {status.notification && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        className="w-full"
                    >
                        <div className={`p-5 rounded-2xl border backdrop-blur-xl flex items-start gap-4 transition-all duration-500 shadow-lg ${status.notification.type === 'ERROR'
                                ? 'bg-neon-pink/10 border-neon-pink/30 text-neon-pink shadow-neon-pink/10'
                                : 'bg-neon-orange/10 border-neon-orange/30 text-neon-orange shadow-neon-orange/10'
                            }`}>
                            <div className="flex-shrink-0 mt-1">
                                <span className="material-symbols-outlined text-2xl animate-pulse">
                                    {status.notification.type === 'ERROR' ? 'gpp_maybe' : 'shield_with_heart'}
                                </span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-1 font-mono">
                                    {status.notification.title}
                                </h3>
                                <p className="text-[11px] font-bold opacity-80 leading-relaxed font-mono">
                                    {status.notification.message}
                                </p>
                            </div>
                            <div className="flex-shrink-0 self-center">
                                <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-white/5 rounded-lg border border-white/10 font-mono">
                                    Agent Alert
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════ METRICS ═══════════ */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { l: 'Repository Target', v: status.repo_url.replace('https://github.com/', ''), i: 'hub', col: 'md:col-span-2', glow: '#818cf8' },
                    { l: 'Detected Anomalies', v: status.failures_detected, i: 'radar', c: status.failures_detected > 0 ? 'text-neon-pink' : 'text-slate-400', big: true, glow: '#f472b6' },
                    { l: 'Patches Applied', v: status.fixes_applied, i: 'auto_fix_normal', c: status.fixes_applied > 0 ? 'text-neon-green' : 'text-slate-400', big: true, glow: '#34d399' },
                    { l: 'Time Elapsed', v: formatTime(status.total_time_seconds), i: 'pace', mono: true, glow: '#a78bfa' },
                ].map((s, i) => (
                    <motion.div
                        key={s.l}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + (i * 0.05) }}
                        className={`holo-card rounded-2xl p-5 flex flex-col justify-between group hover:border-white/[0.1] transition-all duration-500 ${s.col || ''}`}
                        style={{ '--hover-glow': s.glow } as React.CSSProperties}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-[16px] text-slate-500 group-hover:text-neon-indigo transition-colors">{s.i}</span>
                            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 font-mono">{s.l}</span>
                        </div>
                        <span className={`${s.big ? 'text-3xl font-black tabular-nums' : 'text-base font-semibold'} ${s.mono ? 'font-mono text-slate-400' : ''} ${s.c || 'text-slate-200'} truncate w-full`}
                            style={s.big ? { textShadow: `0 0 20px ${s.glow}40` } : undefined}>
                            {s.big ? <AnimNum value={Number(s.v)} /> : s.v}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* ═══════════ DATA GRID ═══════════ */}
            <div className="grid lg:grid-cols-4 gap-6">

                {/* Score Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-1 holo-card rounded-2xl p-6 flex flex-col gap-6"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 font-mono">Agent Score</span>
                        <span className="material-symbols-outlined text-slate-600"
                            style={{ filter: 'drop-shadow(0 0 8px rgba(129,140,248,0.3))' }}>workspace_premium</span>
                    </div>

                    <div className="relative w-full aspect-square max-w-[200px] mx-auto flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="48" stroke="rgba(30,41,59,0.8)" strokeWidth="4" fill="transparent" />
                            <circle cx="60" cy="60" r="48"
                                stroke="url(#scoreGradDark)"
                                strokeWidth="4"
                                fill="transparent"
                                strokeDasharray={`${(isDone ? finalScore / 110 : 0) * 301} 301`}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-in-out"
                                style={{ filter: 'drop-shadow(0 0 8px rgba(129,140,248,0.4))' }}
                            />
                            <defs>
                                <linearGradient id="scoreGradDark" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#818cf8" />
                                    <stop offset="50%" stopColor="#f472b6" />
                                    <stop offset="100%" stopColor="#22d3ee" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-black text-white tabular-nums tracking-tighter"
                                style={{ textShadow: '0 0 20px rgba(129,140,248,0.4)' }}>
                                {isDone ? <AnimNum value={finalScore} /> : '--'}
                            </span>
                            <span className="text-[10px] font-extrabold text-neon-indigo tracking-[0.2em] uppercase font-mono"
                                style={{ textShadow: '0 0 10px rgba(129,140,248,0.5)' }}>/110 PTS</span>
                        </div>
                    </div>

                    {isDone && (
                        <div className="space-y-2 pt-4 border-t border-white/[0.04]">
                            {items.map((it, i) => (
                                <div key={i} className="flex justify-between items-center bg-surface-800/50 backdrop-blur-md px-3 py-2.5 rounded-lg border border-white/[0.03]">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">{it.label}</span>
                                    <span className={`text-[11px] font-black tracking-widest font-mono ${it.c}`}>{it.val}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Console / Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="lg:col-span-3 holo-card rounded-2xl overflow-hidden flex flex-col min-h-[500px]"
                >
                    {/* Tab bar */}
                    <div className="flex bg-surface-800/80 border-b border-white/[0.04] p-2 gap-2 backdrop-blur-xl">
                        {(['fixes', 'logs'] as const).map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`flex-1 py-3 text-[11px] font-black uppercase tracking-[0.25em] rounded-xl transition-all relative cursor-pointer font-mono ${tab === t
                                    ? 'bg-surface-700 text-neon-indigo border border-neon-indigo/20'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-surface-700/50 border border-transparent'
                                    }`}
                                style={tab === t ? { boxShadow: '0 0 20px -5px rgba(129,140,248,0.2)' } : undefined}>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">{t === 'fixes' ? 'data_object' : 'terminal'}</span>
                                    {t === 'fixes' ? `Fix Ledger (${status.fixes.length})` : 'Telemetry Stream'}
                                </div>
                                {tab === t && <motion.div layoutId="tab-active-dark" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-neon-indigo rounded-full"
                                    style={{ boxShadow: '0 0 10px rgba(129,140,248,0.5)' }} />}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {tab === 'fixes' ? (
                            <motion.div key="fixes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 overflow-auto p-5 custom-scrollbar">
                                <table className="w-full text-left border-separate border-spacing-y-2">
                                    <thead>
                                        <tr className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] font-mono">
                                            <th className="px-4 pb-2">Anatomy</th>
                                            <th className="px-4 pb-2">Vector</th>
                                            <th className="px-4 pb-2 text-center">Loc</th>
                                            <th className="px-4 pb-2 w-1/2">Resolution Result</th>
                                            <th className="px-4 pb-2 text-right">Integrity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {status.fixes.map((fix, i) => {
                                            const s = BUG_STYLES[fix.bug_type] || BUG_STYLES.LOGIC;
                                            const isAiFix = fix.status === 'AI_FIXED';
                                            return (
                                                <motion.tr key={i}
                                                    initial={{ opacity: 0, x: -15 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.04 }}
                                                    className="bg-surface-800/60 hover:bg-surface-700/80 transition-all border border-white/[0.03] group rounded-xl"
                                                >
                                                    <td className="px-4 py-4 rounded-l-xl text-[12px] font-mono font-bold text-slate-300">{fix.file}</td>
                                                    <td className="px-4 py-4">
                                                        <span className={`text-[9px] px-3 py-1 rounded-full border font-black tracking-widest ${s.badge} ${s.text}`}
                                                            style={{ boxShadow: `0 0 10px -3px ${s.glow}` }}>
                                                            {fix.bug_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center text-[11px] font-mono font-black text-slate-500">L{fix.line_number}</td>
                                                    <td className="px-4 py-4 font-mono">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[11px] font-bold text-slate-400 line-clamp-1 opacity-80 group-hover:opacity-100 transition-opacity" title={formatPS3(fix)}>{formatPS3(fix)}</span>
                                                            {!isAiFix && <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">warning</span> fallback: documentation applied</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 rounded-r-xl text-right">
                                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${isAiFix ? 'bg-neon-green/10 border-neon-green/20 text-neon-green' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                            }`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${isAiFix ? 'bg-neon-green animate-pulse' : 'bg-amber-400'}`}
                                                                style={isAiFix ? { boxShadow: '0 0 8px rgba(52,211,153,0.6)' } : undefined} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest font-mono">
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
                                                    <span className="material-symbols-outlined text-5xl text-slate-600"
                                                        style={{ filter: isRunning ? 'drop-shadow(0 0 15px rgba(129,140,248,0.4))' : 'none' }}>
                                                        {isRunning ? 'radar' : 'verified'}
                                                    </span>
                                                    {isRunning && <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -inset-4 bg-neon-indigo/10 rounded-full" />}
                                                </div>
                                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 font-mono">{isRunning ? 'Scanning Neural Patterns...' : 'Infrastructure Verified Optimal'}</p>
                                            </td></tr>
                                        )}
                                    </tbody>
                                </table>

                                {isDone && (
                                    <div className="mt-8 flex justify-center">
                                        <motion.button
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => {
                                                const blob = new Blob([JSON.stringify(status, null, 2)], { type: 'application/json' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `fixora-report-${status.job_id.slice(0, 8)}.json`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            }}
                                            className="neon-button px-8 py-4 rounded-2xl font-black text-xs tracking-[0.3em] uppercase flex items-center gap-3 group cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined group-hover:translate-y-1 transition-transform">download</span>
                                            DOWNLOAD EXECUTION REPORT
                                        </motion.button>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex-1 overflow-auto p-8 text-[12px] font-mono custom-scrollbar selection:bg-neon-indigo/40"
                                style={{ background: 'linear-gradient(180deg, #0a0f1e 0%, #030712 100%)' }}>
                                <div className="space-y-1">
                                    {logLines.map((line, i) => {
                                        let c = 'text-slate-500';
                                        if (line.includes('FAILED') || line.includes('Error')) c = 'text-red-400';
                                        else if (line.includes('PASS') || line.includes('OK')) c = 'text-neon-green';
                                        else if (line.includes('WARNING') || line.includes('Iteration')) c = 'text-neon-orange';
                                        else if (line.includes('Agent') || line.includes('Resolved')) c = 'text-neon-violet';
                                        return (
                                            <div key={i} className={`flex items-start gap-4 leading-relaxed tracking-tight break-all ${c} hover:bg-white/[0.02] px-2 py-0.5 rounded transition-colors group`}>
                                                <span className="text-slate-700 select-none text-right w-10 shrink-0 font-bold opacity-40 group-hover:opacity-100 transition-opacity">{(i + 1)}</span>
                                                <span className="flex-1">{line}</span>
                                            </div>
                                        );
                                    })}
                                    {logLines.length === 0 && (
                                        <div className="text-neon-indigo/50 animate-pulse flex items-center gap-3 font-black tracking-[0.3em] uppercase text-[10px]">
                                            <div className="w-2 h-5 bg-neon-indigo animate-terminal-blink" />
                                            Handshaking Pipeline...
                                        </div>
                                    )}
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
