export interface RunAgentRequest {
    repo_url: string;
    team_name: string;
    leader_name: string;
    retry_limit: number;
}

export interface FixResult {
    file: string;
    bug_type: string;
    line_number: number;
    commit_message: string;
    status: string;
}

export interface TimelineEvent {
    iteration: number;
    status: string;
    timestamp: string;
}

export interface RunStatusResponse {
    job_id: string;
    repo_url: string;
    branch_name: string;
    failures_detected: number;
    fixes_applied: number;
    iterations_used: number;
    retry_limit: number;
    total_time_seconds: number;
    status: "QUEUED" | "RUNNING" | "PASSED" | "FAILED" | "ERROR" | "FIXING" | "FINISHED";
    score: number;
    fixes: FixResult[];
    timeline: TimelineEvent[];
    raw_logs: string;
}

// Strip any trailing slash the user might have accidentally included in the Vercel dashboard
const rawApiUrl = import.meta.env.VITE_API_URL || '';
const API_BASE = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

export const api = {
    runAgent: async (data: RunAgentRequest): Promise<{ job_id: string }> => {
        // Strip out the hardcoded `/api/` prefix to match the FastAPI routing directly
        const url = API_BASE ? `${API_BASE}/run-agent` : '/run-agent';
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to start deployment sequence. Verify Railway backend is online.');
        return res.json();
    },

    getStatus: async (jobId: string): Promise<RunStatusResponse> => {
        const url = API_BASE ? `${API_BASE}/run-status/${jobId}` : `/run-status/${jobId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch telemetry status.');
        return res.json();
    }
};
