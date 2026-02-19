import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../api';

interface RunFormProps {
    onRunStarted: (jobId: string) => void;
}

export const RunForm: React.FC<RunFormProps> = ({ onRunStarted }) => {
    const [repoUrl, setRepoUrl] = useState('');
    const [teamName, setTeamName] = useState('');
    const [leaderName, setLeaderName] = useState('');
    const [retryLimit, setRetryLimit] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { job_id } = await api.runAgent({
                repo_url: repoUrl,
                team_name: teamName,
                leader_name: leaderName,
                retry_limit: retryLimit,
            });
            onRunStarted(job_id);
        } catch {
            setError('Deployment sequence failed. Verify credentials and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6, type: "spring", stiffness: 200 }}
            className="w-full relative z-20 group"
        >
            {/* Soft inner glow & frosted glass */}
            <div className="glass-card-deep rounded-3xl p-8 lg:p-10 w-full backdrop-blur-[60px] relative overflow-hidden ring-1 ring-white/60 drop-shadow-2xl transition-all duration-500 hover:ring-[#6366F1]/20">

                {/* Micro accent block top right */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#6366F1]/10 to-transparent rounded-bl-[4rem]" />

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black tracking-tight text-slate-800">Launch Sequence</h3>
                        <p className="text-[11px] font-bold text-slate-400 tracking-[0.1em] uppercase mt-1">Initialize CI/CD Agent</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 shadow-inner flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#6366F1] text-[20px]">psychology</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Repo URL */}
                    <div className="space-y-2 group/input">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.15em] ml-1 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">public</span>
                            Source Repository
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 group-focus-within/input:text-[#6366F1] transition-colors text-[20px]">link</span>
                            <input
                                id="input-repo-url"
                                type="url"
                                required
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                className="premium-input pl-12 shadow-inner"
                                placeholder="https://github.com/org/repo"
                            />
                        </div>
                    </div>

                    {/* Team & Leader Layout */}
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2 group/input">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.15em] ml-1 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px]">groups</span>
                                Division
                            </label>
                            <input
                                id="input-team-name"
                                type="text"
                                required
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="premium-input shadow-inner"
                                placeholder="BINATEX"
                            />
                        </div>
                        <div className="space-y-2 group/input">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.15em] ml-1 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px]">shield_person</span>
                                Commander
                            </label>
                            <input
                                id="input-leader-name"
                                type="text"
                                required
                                value={leaderName}
                                onChange={(e) => setLeaderName(e.target.value)}
                                className="premium-input shadow-inner"
                                placeholder="LAKSHMI M"
                            />
                        </div>
                    </div>

                    {/* Iteration Engine Slider */}
                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-end mb-1">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.15em] ml-1 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px]">cycle</span>
                                Deep Search Depth
                            </label>
                            <span className="text-xl font-black text-[#6366F1] tabular-nums tracking-tighter shadow-sm bg-white/60 px-2 rounded-md">
                                {retryLimit}<span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase ml-1">Iter</span>
                            </span>
                        </div>
                        <input
                            id="input-retry-limit"
                            type="range"
                            min="1"
                            max="20"
                            value={retryLimit}
                            onChange={(e) => setRetryLimit(parseInt(e.target.value))}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 accent-[#6366F1] shadow-inner"
                        />
                        <div className="flex justify-between text-[9px] font-extrabold text-slate-400 tracking-widest px-1">
                            <span>MIN (1)</span>
                            <span>MAX (20)</span>
                        </div>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, y: -10 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -10 }}
                                className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 w-full shadow-sm"
                            >
                                <span className="material-symbols-outlined text-red-500 bg-white rounded-full p-1 shadow-sm">error</span>
                                <p className="text-red-600 text-[11px] font-bold tracking-wide">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Execute Button */}
                    <motion.button
                        id="btn-run-agent"
                        type="submit"
                        disabled={loading}
                        whileTap={{ scale: 0.98 }}
                        className="w-full premium-button h-14 mt-4 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                                <span className="text-[13px] tracking-[0.2em]">EXECUTING...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[20px] group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:scale-110 transition-transform duration-300">rocket_launch</span>
                                <span className="text-[13px] tracking-[0.2em] font-black">DEPLOY REPAIR SEQUENCE</span>
                            </>
                        )}
                    </motion.button>
                </form>
            </div>
        </motion.div>
    );
};
