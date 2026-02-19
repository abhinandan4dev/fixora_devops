import React, { useState } from 'react';
import { api } from '../api';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
                retry_limit: retryLimit
            });
            onRunStarted(job_id);
        } catch (err) {
            setError('Failed to start run. Please check inputs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-10 rounded-3xl relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-50"></div>

            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                    <span className="material-symbols-outlined text-primary text-2xl">rocket_launch</span>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Initiate Sequence</h2>
                    <p className="text-sm text-slate-400">Configure target repository parameters</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">TARGET REPOSITORY</label>
                    <div className="relative group">
                        <span className="absolute left-4 top-3.5 text-slate-500 material-symbols-outlined text-lg group-focus-within:text-primary transition-colors">link</span>
                        <input
                            type="url"
                            required
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-black/40 border border-white/10 text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all font-mono text-sm"
                            placeholder="https://github.com/org/repo"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">TEAM ID</label>
                        <input
                            type="text"
                            required
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full px-4 py-4 rounded-xl bg-black/40 border border-white/10 text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all font-mono text-sm"
                            placeholder="Team Alpha"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">OPERATOR</label>
                        <input
                            type="text"
                            required
                            value={leaderName}
                            onChange={(e) => setLeaderName(e.target.value)}
                            className="w-full px-4 py-4 rounded-xl bg-black/40 border border-white/10 text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all font-mono text-sm"
                            placeholder="John Doe"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">MAX RETRY CYCLES</label>
                        <span className="text-xs font-mono text-primary">{retryLimit} CYCLES</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={retryLimit}
                        onChange={(e) => setRetryLimit(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
                    >
                        <span className="material-symbols-outlined text-red-500">error</span>
                        <p className="text-red-400 text-sm">{error}</p>
                    </motion.div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full group relative overflow-hidden bg-primary hover:bg-primary/90 text-white font-bold py-5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative flex items-center gap-2 tracking-widest uppercase text-sm">
                        {loading ? <Loader2 className="animate-spin" /> : <>Initialize Agent <span className="material-symbols-outlined text-lg">arrow_forward</span></>}
                    </span>
                </button>
            </form>
        </motion.div>
    );
};
