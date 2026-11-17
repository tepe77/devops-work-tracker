export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'viewer';
    is_admin: boolean;
    is_viewer: boolean;
    is_active?: boolean;
    email_verified_at?: string;
    created_at?: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    is_active: boolean;
    tasks_count?: number;
}

export interface Project {
    id: number;
    name: string;
    slug: string;
    description?: string;
    status: 'active' | 'completed' | 'archived';
    start_date?: string;
    due_date?: string;
    tasks_count?: number;
}

export interface InfrastructureAsset {
    id: number;
    name: string;
    asset_type: 'virtual_machine' | 'physical_server' | 'database' | 'container_host' | 'application_service' | 'network' | 'storage' | 'other';
    environment: 'production' | 'staging' | 'development' | 'disaster_recovery' | 'other';
    hostname?: string;
    ip_address?: string;
    operating_system?: string;
    purpose?: string;
    description?: string;
    status: 'active' | 'maintenance' | 'retired';
    tasks_count?: number;
    tasks?: Task[];
    created_at?: string;
}

export interface Evidence {
    id: number;
    task_id: number;
    task_update_id?: number;
    uploaded_by: number;
    original_name: string;
    storage_path: string;
    mime_type: string;
    file_size: number;
    caption?: string;
    uploader?: User;
    created_at: string;
}

export interface TaskUpdate {
    id: number;
    task_id: number;
    user_id: number;
    activity_date: string;
    summary: string;
    work_done: string;
    result?: string;
    blocker?: string;
    next_action?: string;
    progress_percent: number;
    status: 'backlog' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
    user?: User;
    task?: Task;
    evidences?: Evidence[];
    created_at: string;
}

export interface Task {
    id: number;
    task_code: string;
    title: string;
    description: string;
    project_id?: number;
    category_id: number;
    created_by: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'backlog' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
    progress_percent: number;
    start_date: string;
    due_date?: string;
    completed_at?: string;
    project?: Project;
    category?: Category;
    creator?: User;
    assets?: InfrastructureAsset[];
    updates?: TaskUpdate[];
    evidences?: Evidence[];
    created_at: string;
}

export interface AuditLog {
    id: number;
    user_id?: number;
    event: string;
    auditable_type: string;
    auditable_id: number;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    metadata?: Record<string, any>;
    created_at: string;
    user?: User;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash?: {
        success?: string;
        error?: string;
    };
};
