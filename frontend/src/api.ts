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
    repo_url: string;
    branch_name: string;
    failures_detected: number;
    fixes_applied: number;
    iterations_used: number;
    retry_limit: number;
    total_time_seconds: number;
    status: "QUEUED" | "RUNNING" | "PASSED" | "FAILED" | "ERROR" | "FIXING" | "FINISHED";
    fixes: FixResult[];
    timeline: TimelineEvent[];
    raw_logs: string;
}

export const api = {
    runAgent: async (data: RunAgentRequest): Promise<{ job_id: string }> => {
        const res = await fetch('/api/run-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to start agent');
        return res.json();
    },

    getStatus: async (jobId: string): Promise<RunStatusResponse> => {
        const res = await fetch(`/api/run-status/${jobId}`);
        if (!res.ok) throw new Error('Failed to get status');
        return res.json();
    }
};
