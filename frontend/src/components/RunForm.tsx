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
    const [retry_limit, setRetryLimit] = useState(5);
    const [apiKey, setApiKey] = useState('');
    const [githubToken, setGithubToken] = useState('');
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
                retry_limit: retry_limit,
                api_key: apiKey || undefined,
                github_token: githubToken || undefined,
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
            <div className="holo-card-glow rounded-3xl p-8 lg:p-10 w-full relative">

                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-28 h-28 opacity-30 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 100% 0%, rgba(129,140,248,0.2), transparent 70%)' }} />
                <div className="absolute bottom-0 left-0 w-20 h-20 opacity-20 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 0% 100%, rgba(244,114,182,0.2), transparent 70%)' }} />

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                            Launch Sequence
                            <motion.div
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-2 h-2 rounded-full bg-neon-green ml-1"
                                style={{ boxShadow: '0 0 10px rgba(52,211,153,0.5)' }}
                            />
                        </h3>
                        <p className="text-[11px] font-bold text-slate-500 tracking-[0.15em] uppercase mt-1 font-mono">
                            Initialize CI/CD Agent Pipeline
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-surface-800 border border-white/[0.06] flex items-center justify-center"
                        style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 0 20px -5px rgba(129,140,248,0.2)' }}>
                        <span className="material-symbols-outlined text-neon-indigo text-[22px]"
                            style={{ filter: 'drop-shadow(0 0 8px rgba(129,140,248,0.4))' }}>psychology</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Repository URL */}
                    <div className="space-y-2.5 group/input">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2 font-mono">
                            <span className="material-symbols-outlined text-[13px] text-neon-indigo">public</span>
                            Source Repository
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-600 group-focus-within/input:text-neon-indigo transition-colors duration-300 text-[18px]"
                                style={{ filter: 'drop-shadow(0 0 6px rgba(129,140,248,0.3))' }}>link</span>
                            <input
                                id="input-repo-url"
                                type="url"
                                required
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                className="cyber-input pl-12"
                                placeholder="https://github.com/org/repo"
                            />
                        </div>
                    </div>

                    {/* Team & Leader */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2.5 group/input">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2 font-mono">
                                <span className="material-symbols-outlined text-[13px] text-neon-pink">groups</span>
                                Division
                            </label>
                            <input
                                id="input-team-name"
                                type="text"
                                required
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="cyber-input"
                                placeholder="BINATEX"
                            />
                        </div>
                        <div className="space-y-2.5 group/input">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2 font-mono">
                                <span className="material-symbols-outlined text-[13px] text-neon-cyan">shield_person</span>
                                Commander
                            </label>
                            <input
                                id="input-leader-name"
                                type="text"
                                required
                                value={leaderName}
                                onChange={(e) => setLeaderName(e.target.value)}
                                className="cyber-input"
                                placeholder="LAKSHMI M"
                            />
                        </div>
                    </div>

                    {/* API Key */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2.5 group/input">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2 font-mono">
                                <span className="material-symbols-outlined text-[13px] text-neon-indigo">key</span>
                                AI Explorer Key (Optional)
                            </label>
                            <div className="relative">
                                <input
                                    id="input-api-key"
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="cyber-input pr-12"
                                    placeholder="Enter Gemini API Key (The Brain)"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                    <span className="text-[9px] font-bold text-slate-600 tracking-widest uppercase font-mono">
                                        {apiKey ? 'ENCRYPTED' : 'SYSTEM'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2.5 group/input">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2 font-mono">
                                <span className="material-symbols-outlined text-[13px] text-neon-pink">hub</span>
                                GitHub Authorization (Optional)
                            </label>
                            <div className="relative">
                                <input
                                    id="input-github-token"
                                    type="password"
                                    value={githubToken}
                                    onChange={(e) => setGithubToken(e.target.value)}
                                    className="cyber-input pr-12"
                                    placeholder="Enter GitHub PAT (The Access Card)"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                    <span className="text-[9px] font-bold text-slate-600 tracking-widest uppercase font-mono">
                                        {githubToken ? 'AUTH ON' : 'PUBLIC'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Depth Slider */}
                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-end mb-1">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2 font-mono">
                                <span className="material-symbols-outlined text-[13px] text-neon-violet">cycle</span>
                                Deep Search Depth
                            </label>
                            <span className="text-xl font-black text-neon-indigo tabular-nums tracking-tighter font-mono px-3 py-1 rounded-lg bg-neon-indigo/10 border border-neon-indigo/20"
                                style={{ textShadow: '0 0 15px rgba(129,140,248,0.5)' }}>
                                {retry_limit}<span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase ml-1.5">Iter</span>
                            </span>
                        </div>
                        <div className="relative">
                            <input
                                id="input-retry-limit"
                                type="range"
                                min="1"
                                max="20"
                                value={retry_limit}
                                onChange={(e) => setRetryLimit(parseInt(e.target.value))}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, #818cf8 0%, #818cf8 ${((retry_limit - 1) / 19) * 100}%, rgba(30,41,59,0.8) ${((retry_limit - 1) / 19) * 100}%, rgba(30,41,59,0.8) 100%)`,
                                    boxShadow: `0 0 10px -2px rgba(129,140,248,${0.2 + (retry_limit / 20) * 0.3})`
                                }}
                            />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-slate-600 tracking-widest px-1 font-mono">
                            <span>MIN::1</span>
                            <span>MAX::20</span>
                        </div>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, y: -10 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -10 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 w-full"
                                style={{ boxShadow: '0 0 20px -5px rgba(239,68,68,0.2)' }}
                            >
                                <span className="material-symbols-outlined text-red-400 text-[18px]"
                                    style={{ filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.5))' }}>error</span>
                                <p className="text-red-300 text-[11px] font-bold tracking-wide font-mono">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit */}
                    <motion.button
                        id="btn-run-agent"
                        type="submit"
                        disabled={loading}
                        whileTap={{ scale: 0.98 }}
                        whileHover={{ scale: 1.01 }}
                        className="w-full neon-button h-14 mt-4 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group relative"
                    >
                        {/* Button shimmer */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                        {loading ? (
                            <>
                                <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                                <span className="text-[12px] tracking-[0.3em] font-mono font-bold">EXECUTING...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[20px] group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:scale-110 transition-transform duration-300"
                                    style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }}>rocket_launch</span>
                                <span className="text-[12px] tracking-[0.25em] font-black">DEPLOY REPAIR SEQUENCE</span>
                            </>
                        )}
                    </motion.button>
                </form>
            </div>
        </motion.div>
    );
};
