export interface ScriptSession {
    id: string;
    project_id: string;
    title?: string;
    current_script?: string;
    status: 'active' | 'archived';
    created_at: string;
    updated_at: string;
}
export interface ScriptMessage {
    id: string;
    session_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    script_version?: string;
    created_at: string;
}
export interface ScriptSessionWithMessages extends ScriptSession {
    messages: ScriptMessage[];
}
export declare const scriptSessionModel: {
    create(data: {
        project_id: string;
        title?: string;
    }): ScriptSession;
    findById(id: string): ScriptSession | null;
    findByProjectId(projectId: string): ScriptSession[];
    update(id: string, data: Partial<ScriptSession>): ScriptSession | null;
    delete(id: string): boolean;
    findWithMessages(id: string): ScriptSessionWithMessages | null;
};
export declare const scriptMessageModel: {
    create(data: {
        session_id: string;
        role: "user" | "assistant" | "system";
        content: string;
        script_version?: string;
    }): ScriptMessage;
    findById(id: string): ScriptMessage | null;
    findBySessionId(sessionId: string): ScriptMessage[];
    delete(id: string): boolean;
};
//# sourceMappingURL=scriptSession.d.ts.map