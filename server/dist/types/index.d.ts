export type ProjectStatus = 'draft' | 'processing' | 'completed';
export type StoryboardStatus = 'pending' | 'generating' | 'completed' | 'error';
export type AIServiceType = 'claude' | 'gemini' | 'openai' | 'volcengine' | 'qwen' | 'kimi' | 'glm' | 'deepseek';
export type FunctionType = 'storyboard' | 'image' | 'narration' | 'speech' | 'video';
export type ResourceType = 'image' | 'video' | 'audio';
export type ResourceSubtype = 'first_frame' | 'last_frame' | 'merged' | 'speech';
export type TaskType = 'storyboard' | 'image' | 'video' | 'narration' | 'speech' | 'merge';
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type RegenerateType = 'all' | 'image' | 'video' | 'narration' | 'speech';
export interface Project {
    id: string;
    name: string;
    description?: string;
    script?: string;
    status: ProjectStatus;
    created_at: string;
    updated_at: string;
}
export interface Storyboard {
    id: string;
    project_id: string;
    sequence: number;
    scene_description?: string;
    visual_description?: string;
    duration: number;
    narration?: string;
    group_index?: number;
    status: StoryboardStatus;
    created_at: string;
    updated_at: string;
}
export interface StoryboardGroup {
    id: string;
    index: number;
    storyboards: StoryboardWithResources[];
    merged_video_id?: string;
    merged_video_url?: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
}
export interface StoryboardWithResources extends Storyboard {
    first_frame_url?: string;
    last_frame_url?: string;
    video_url?: string;
    speech_url?: string;
}
export interface Resource {
    id: string;
    type: ResourceType;
    subtype?: ResourceSubtype;
    file_path: string;
    file_size?: number;
    mime_type?: string;
    storyboard_id?: string;
    project_id?: string;
    metadata?: string;
    created_at: string;
}
export interface StoryboardResource {
    id: string;
    storyboard_id: string;
    resource_id: string;
    resource_role: 'first_frame' | 'last_frame' | 'video' | 'speech';
    created_at: string;
}
export interface AIServiceConfig {
    id: string;
    service_type: AIServiceType;
    function_type: FunctionType;
    api_key: string;
    endpoint?: string;
    model: string;
    is_enabled: number;
    extra_config?: string;
    created_at: string;
    updated_at: string;
}
export interface Prompt {
    id: string;
    name: string;
    content: string;
    function_type: FunctionType;
    is_active: number;
    variables?: string;
    created_at: string;
    updated_at: string;
}
export interface Task {
    id: string;
    type: TaskType;
    status: TaskStatus;
    project_id?: string;
    storyboard_id?: string;
    progress: number;
    result?: string;
    error?: string;
    started_at?: string;
    completed_at?: string;
    created_at: string;
}
export interface GenerationHistory {
    id: string;
    storyboard_id: string;
    type: 'image' | 'video' | 'narration' | 'speech';
    resource_id?: string;
    prompt_id?: string;
    ai_service_id?: string;
    created_at: string;
}
export interface ApiResponse<T> {
    data?: T;
    message?: string;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
}
//# sourceMappingURL=index.d.ts.map