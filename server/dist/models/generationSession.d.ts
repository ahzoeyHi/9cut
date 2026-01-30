export type GenerationSessionType = 'storyboard' | 'image' | 'video' | 'speech';
export interface GenerationSession {
    id: string;
    type: GenerationSessionType;
    project_id: string;
    storyboard_id?: string;
    title?: string;
    current_result?: string;
    status: 'active' | 'archived';
    created_at: string;
    updated_at: string;
}
export interface GenerationMessage {
    id: string;
    session_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    result_snapshot?: string;
    created_at: string;
}
export interface GenerationSessionWithMessages extends GenerationSession {
    messages: GenerationMessage[];
}
export declare const generationSessionModel: {
    create(data: {
        type: GenerationSessionType;
        project_id: string;
        storyboard_id?: string;
        title?: string;
    }): GenerationSession;
    getDefaultTitle(type: GenerationSessionType): string;
    findById(id: string): GenerationSession | null;
    findByProjectAndType(projectId: string, type: GenerationSessionType): GenerationSession[];
    findByStoryboardAndType(storyboardId: string, type: GenerationSessionType): GenerationSession[];
    update(id: string, data: Partial<GenerationSession>): GenerationSession | null;
    delete(id: string): boolean;
    findWithMessages(id: string): GenerationSessionWithMessages | null;
};
export declare const generationMessageModel: {
    create(data: {
        session_id: string;
        role: "user" | "assistant" | "system";
        content: string;
        result_snapshot?: string;
    }): GenerationMessage;
    findById(id: string): GenerationMessage | null;
    findBySessionId(sessionId: string): GenerationMessage[];
    delete(id: string): boolean;
};
//# sourceMappingURL=generationSession.d.ts.map