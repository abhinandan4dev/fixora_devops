import React, { useState } from 'react';
import { api } from '../api';
import { Loader2 } from 'lucide-react';

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
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 max-w-2xl mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">rocket_launch</span>
                Start New Healing Run
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">GitHub Repository URL</label>
                    <input 
                        type="url" 
                        required
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="https://github.com/org/repo"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Team Name</label>
                        <input 
                            type="text" 
                            required
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="Team Alpha"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Leader Name</label>
                        <input 
                            type="text" 
                            required
                            value={leaderName}
                            onChange={(e) => setLeaderName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            placeholder="John Doe"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Retry Limit (Default: 5)</label>
                    <input 
                        type="number" 
                        min="1"
                        max="20"
                        value={retryLimit}
                        onChange={(e) => setRetryLimit(parseInt(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Initialize Agent'}
                </button>
            </form>
        </div>
    );
};
