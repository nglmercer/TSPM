/**
 * Shared TypeScript types for TSPM Web Components
 * Provides type safety for all frontend components
 */

// ============================================
// Process Types
// ============================================

/**
 * Process status data from the API
 * Matches the ProcessStatusWithStats interface from the backend
 */
export interface ProcessStatus {
    name: string;
    pid?: number;
    killed?: boolean;
    exitCode?: number;
    state?: ProcessState;
    restartCount?: number;
    uptime?: number;
    instanceId?: number;
    clusterGroup?: string;
    healthy?: boolean;
    namespace?: string;
    cpu: number;
    memory: number;
}

/**
 * Possible process states
 */
export type ProcessState = 'running' | 'stopped' | 'starting' | 'stopping' | 'errored' | 'unknown';

/**
 * Form configuration for spawning a new process
 */
export interface ProcessFormConfig {
    name: string;
    script: string;
    interpreter?: string;
    instances?: number;
    args?: string[];
    namespace?: string;
    install?: string;
    build?: string;
}

// ============================================
// System Stats Types
// ============================================

/**
 * System statistics from the API
 */
export interface SystemStats {
    cpu: number;
    memory: number;
    uptime: number;
}

// ============================================
// WebSocket Message Types
// ============================================

/**
 * WebSocket message types from the server
 */
export type WebSocketMessageType = 
    | 'process:update'
    | 'process:log'
    | 'terminal:out'
    | 'system:stats';

/**
 * Generic WebSocket message from server
 */
export interface WebSocketMessage<T = unknown> {
    type: WebSocketMessageType;
    payload: T;
}

/**
 * Process update payload
 */
export interface ProcessUpdatePayload {
    processes: ProcessStatus[];
}

/**
 * Process log entry
 */
export interface ProcessLogEntry {
    timestamp?: string;
    processName?: string;
    message?: string;
}

/**
 * Terminal output entry
 */
export interface TerminalEntry {
    text: string;
    type: 'input' | 'output' | 'error';
}

// ============================================
// API Response Types
// ============================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    path?: string;
}

/**
 * Status API response data
 */
export interface StatusResponseData {
    processes: ProcessStatus[];
}

/**
 * Logs API response data
 */
export interface LogsResponseData {
    logs: ProcessLogEntry[];
}

/**
 * Stats API response data
 */
export interface StatsResponseData {
    cwd: string;
    [key: string]: unknown;
}

/**
 * Execute API request body
 */
export interface ExecuteRequestBody {
    command: string;
    cwd: string;
}

/**
 * Execute API response data
 */
export interface ExecuteResponseData {
    output?: string;
    error?: string;
    newCwd?: string;
}

// ============================================
// Event Types
// ============================================

/**
 * Custom event detail for view changes
 */
export interface ViewChangeDetail {
    view: ViewType;
}

/**
 * Custom event detail for viewing logs
 */
export interface ViewLogsDetail {
    processName: string;
}

/**
 * Available view types
 */
export type ViewType = 'dashboard' | 'processes' | 'terminal' | 'logs' | 'profiles';

// ============================================
// External Library Types
// ============================================

/**
 * Lucide icons library global type
 */
export interface LucideIcons {
    createIcons(options: LucideIconsOptions): void;
}

/**
 * Lucide icons options
 */
export interface LucideIconsOptions {
    attrs?: Record<string, string | number>;
    nameAttr?: string;
    root: ShadowRoot | HTMLElement | null;
}

/**
 * Extended window interface for Lucide
 */
declare global {
    interface Window {
        lucide?: LucideIcons;
    }
}

// ============================================
// Utility Types
// ============================================

/**
 * Type guard to check if a value is a valid process state
 */
export function isProcessState(state: unknown): state is ProcessState {
    return ['running', 'stopped', 'starting', 'stopping', 'errored', 'unknown'].includes(state as string);
}

/**
 * Type guard to check if a value is a valid view type
 */
export function isViewType(view: unknown): view is ViewType {
    return ['dashboard', 'processes', 'terminal', 'logs'].includes(view as string);
}

// ============================================
// Process Profile Types
// ============================================

/**
 * Process configuration from dump.json
 */
export interface DumpProcess {
    name: string;
    script: string;
    interpreter?: string;
    instances?: string | number;
    namespace?: string;
    args?: string[];
    install?: string;
    build?: string;
    env?: Record<string, string>;
}

/**
 * Saved profile containing process configurations
 */
export interface Profile {
    id: string;
    label: string;
    processes: DumpProcess[];
    savedAt: string;
}

/**
 * Form field configuration for dynamic form generation
 */
export interface FormFieldConfig {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'string[]' | 'Record';
    required: boolean;
    label: string;
    placeholder?: string;
    description?: string;
    defaultValue?: unknown;
    options?: { value: string; label: string }[];
    group?: string;
}

/**
 * Full Process Configuration (matches server-side ProcessConfigSchema)
 */
export interface ProcessConfig {
    // Required
    name: string;
    script: string;
    
    // Basic
    args?: string[];
    interpreter?: string;
    env?: Record<string, string>;
    cwd?: string;
    
    // Restart Behavior
    autorestart?: boolean;
    watch?: boolean | string[];
    ignoreWatch?: string[];
    maxRestarts?: number;
    minRestartDelay?: number;
    maxRestartDelay?: number;
    restartBackoff?: number;
    restartDelay?: number;
    
    // Logging
    stdout?: string;
    stderr?: string;
    combineLogs?: boolean;
    mergeLogs?: boolean;
    logDateFormat?: string;
    
    // Runtime
    instances?: number;
    cron?: string;
    killTimeout?: number;
    listenTimeout?: number;
    waitReady?: boolean;
    
    // Process Management
    namespace?: string;
    user?: string;
    group?: string;
    nice?: number;
    
    // Clustering
    lbStrategy?: string;
    instanceWeight?: number;
    instanceVar?: string;
    
    // Health Check
    healthCheck?: HealthCheckConfig;
    
    // Metadata
    instanceId?: number;
    clusterGroup?: string;
    dotEnv?: string;
    
    // Lifecycle Scripts
    preStart?: string;
    install?: string;
    build?: string;
    postStart?: string;
    
    // Resource Limits
    maxMemory?: number;
    minUptime?: number;
    watchDelay?: number;
    
    // Labels & Annotations
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    
    // Infrastructure
    kubernetes?: KubernetesConfig;
    docker?: DockerConfig;
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
    enabled?: boolean;
    protocol?: string;
    url?: string;
    host?: string;
    port?: number;
    path?: string;
    method?: string;
    timeout?: number;
    interval?: number;
    retries?: number;
    initialDelay?: number;
    command?: string;
    expectedStatus?: number;
    responseBody?: string;
}

/**
 * Kubernetes configuration
 */
export interface KubernetesConfig {
    enabled?: boolean;
    podName?: string;
    podNamespace?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    containerName?: string;
    livenessProbe?: string;
    readinessProbe?: string;
    startupProbe?: string;
}

/**
 * Docker configuration
 */
export interface DockerConfig {
    enabled?: boolean;
    containerName?: string;
    labels?: Record<string, string>;
    restartPolicy?: string;
    memoryLimit?: string;
    cpuLimit?: string;
}
