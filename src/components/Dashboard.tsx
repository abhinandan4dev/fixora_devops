import React from 'react';
import { RunStatusResponse } from '../api';

interface DashboardProps {
    status: RunStatusResponse;
}

export const Dashboard: React.FC<DashboardProps> = ({ status }) => {
    const isRunning = status.status === 'RUNNING' || status.status === 'QUEUED';
    const isPassed = status.status === 'PASSED';
    const isFailed = status.status === 'FAILED' || status.status === 'ERROR';

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Summary Card */}
            <section className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 w-full">
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Repository</p>
                            <p className="text-sm font-semibold truncate max-w-[150px]" title={status.repo_url}>{status.repo_url}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Branch</p>
                            <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">account_tree</span>
                                <p className="text-sm font-semibold truncate max-w-[150px]" title={status.branch_name}>{status.branch_name || '-'}</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Failures Found</p>
                            <p className="text-lg font-bold text-red-600">{status.failures_detected}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fixes Applied</p>
                            <p className="text-lg font-bold text-green-600">{status.fixes_applied}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Iterations</p>
                            <p className="text-sm font-semibold">{status.iterations_used} / {status.retry_limit}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</p>
                            <div className="flex items-center gap-1.5">
                                <span className={`material-symbols-outlined text-sm ${isRunning ? 'animate-spin' : ''}`}>
                                    {isRunning ? 'sync' : isPassed ? 'check_circle' : 'error'}
                                </span>
                                <p className="text-sm font-semibold">{status.status}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 p-6 rounded-2xl min-w-[160px] shadow-sm border border-primary/5">
                        <div className={`px-6 py-2 rounded-full font-black text-xl tracking-widest ${
                            isPassed ? 'bg-green-100 text-green-800' : 
                            isFailed ? 'bg-red-100 text-red-800' : 
                            'bg-blue-100 text-blue-800'
                        }`}>
                            {status.status}
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Timeline */}
                <section className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">timeline</span>
                        Remediation Timeline
                    </h3>
                    <div className="relative flex flex-col gap-8 ml-4 border-l-2 border-slate-100 dark:border-slate-800 pl-8 py-2">
                        {status.timeline.map((event, idx) => (
                            <div key={idx} className="relative">
                                <div className={`absolute -left-[41px] top-0 h-6 w-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center ${
                                    event.status === 'PASS' ? 'bg-green-500' : 'bg-slate-300'
                                }`}>
                                    {event.status === 'PASS' && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Iteration {event.iteration}</span>
                                    <p className="font-semibold text-sm mt-1">{event.status === 'PASS' ? 'Tests Passed' : 'Tests Failed'}</p>
                                    <p className="text-xs text-slate-500 mt-1">{event.timestamp}</p>
                                </div>
                            </div>
                        ))}
                        {status.timeline.length === 0 && <p className="text-sm text-slate-400 italic">Waiting for events...</p>}
                    </div>
                </section>

                {/* Fixes Table */}
                <section className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-lg font-bold">Fixes Applied</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">File Path</th>
                                    <th className="px-6 py-4">Bug Type</th>
                                    <th className="px-6 py-4 text-center">Line</th>
                                    <th className="px-6 py-4">Commit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {status.fixes.map((fix, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium">{fix.file}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-mono">
                                                {fix.bug_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-slate-500">{fix.line_number}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500 font-mono truncate max-w-[200px]" title={fix.commit_message}>
                                            {fix.commit_message}
                                        </td>
                                    </tr>
                                ))}
                                {status.fixes.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                                            No fixes applied yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* Logs */}
            <section className="bg-slate-900 rounded-2xl p-6 shadow-sm overflow-hidden">
                <h3 className="text-lg font-bold text-white mb-4 font-mono">Raw Logs</h3>
                <pre className="text-xs text-slate-300 font-mono overflow-x-auto h-64 p-4 bg-black/30 rounded-xl">
                    {status.raw_logs || 'Waiting for logs...'}
                </pre>
            </section>
        </div>
    );
};
