import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { ProcessConfig, FormFieldConfig, DumpProcess } from '../types';

/**
 * Form field definitions based on ProcessConfigSchema
 * Organized by groups for better UX
 */
const PROCESS_CONFIG_FIELDS: FormFieldConfig[] = [
    // Basic Info (always visible)
    {
        name: 'name',
        type: 'string',
        required: true,
        label: 'Name',
        placeholder: 'my-awesome-api',
        description: 'Unique name for the process',
        group: 'basic'
    },
    {
        name: 'script',
        type: 'string',
        required: true,
        label: 'Script, Command or Binary',
        placeholder: './src/index.ts or bun run start',
        description: 'Script or command to run',
        group: 'basic'
    },
    {
        name: 'args',
        type: 'string[]',
        required: false,
        label: 'Arguments',
        placeholder: '--port 8080 --debug',
        description: 'Command line arguments (space-separated)',
        group: 'basic'
    },
    {
        name: 'interpreter',
        type: 'string',
        required: false,
        label: 'Interpreter',
        description: 'Interpreter to use',
        options: [
            { value: '', label: 'Auto-detect' },
            { value: 'bun', label: 'Bun' },
            { value: 'node', label: 'Node' },
            { value: 'python', label: 'Python' },
            { value: 'sh', label: 'Shell (sh)' },
            { value: 'none', label: 'None (Binary)' }
        ],
        group: 'basic'
    },
    
    // Runtime
    {
        name: 'instances',
        type: 'number',
        required: false,
        label: 'Instances',
        placeholder: '1',
        description: 'Number of instances for clustering',
        defaultValue: 1,
        group: 'runtime'
    },
    {
        name: 'cwd',
        type: 'string',
        required: false,
        label: 'Working Directory',
        placeholder: '/path/to/project',
        description: 'Current working directory',
        group: 'runtime'
    },
    {
        name: 'namespace',
        type: 'string',
        required: false,
        label: 'Namespace',
        placeholder: 'production',
        description: 'Process namespace/group',
        group: 'runtime'
    },
    
    // Restart Behavior
    {
        name: 'autorestart',
        type: 'boolean',
        required: false,
        label: 'Auto-restart',
        description: 'Automatically restart on exit',
        defaultValue: true,
        group: 'restart'
    },
    {
        name: 'maxRestarts',
        type: 'number',
        required: false,
        label: 'Max Restarts',
        placeholder: '10',
        description: 'Maximum restart attempts before giving up',
        defaultValue: 10,
        group: 'restart'
    },
    {
        name: 'minRestartDelay',
        type: 'number',
        required: false,
        label: 'Min Restart Delay (ms)',
        placeholder: '100',
        description: 'Minimum delay between restarts in ms',
        defaultValue: 100,
        group: 'restart'
    },
    {
        name: 'maxRestartDelay',
        type: 'number',
        required: false,
        label: 'Max Restart Delay (ms)',
        placeholder: '30000',
        description: 'Maximum delay between restarts in ms',
        defaultValue: 30000,
        group: 'restart'
    },
    {
        name: 'minUptime',
        type: 'number',
        required: false,
        label: 'Min Uptime (ms)',
        placeholder: '0',
        description: 'Minimum uptime in ms before considering restart successful',
        defaultValue: 0,
        group: 'restart'
    },
    
    // Watch Mode
    {
        name: 'watch',
        type: 'boolean',
        required: false,
        label: 'Watch Files',
        description: 'Watch files for changes and restart',
        defaultValue: false,
        group: 'watch'
    },
    {
        name: 'watchDelay',
        type: 'number',
        required: false,
        label: 'Watch Delay (ms)',
        placeholder: '100',
        description: 'Debounce time for file changes',
        defaultValue: 100,
        group: 'watch'
    },
    {
        name: 'ignoreWatch',
        type: 'string[]',
        required: false,
        label: 'Ignore Watch Patterns',
        placeholder: 'node_modules dist',
        description: 'Patterns to ignore in watch mode (space-separated)',
        group: 'watch'
    },
    
    // Lifecycle Scripts
    {
        name: 'install',
        type: 'string',
        required: false,
        label: 'Install Script',
        placeholder: 'bun install',
        description: 'Script to run to install dependencies',
        group: 'lifecycle'
    },
    {
        name: 'build',
        type: 'string',
        required: false,
        label: 'Build Script',
        placeholder: 'bun run build',
        description: 'Script to run to build the project',
        group: 'lifecycle'
    },
    {
        name: 'preStart',
        type: 'string',
        required: false,
        label: 'Pre-start Script',
        placeholder: 'echo "Starting..."',
        description: 'Script to run before starting the process',
        group: 'lifecycle'
    },
    {
        name: 'postStart',
        type: 'string',
        required: false,
        label: 'Post-start Script',
        placeholder: 'echo "Started!"',
        description: 'Script to run after the process has started',
        group: 'lifecycle'
    },
    
    // Timeouts
    {
        name: 'killTimeout',
        type: 'number',
        required: false,
        label: 'Kill Timeout (ms)',
        placeholder: '5000',
        description: 'Time to wait after stop signal before killing',
        defaultValue: 5000,
        group: 'timeouts'
    },
    {
        name: 'listenTimeout',
        type: 'number',
        required: false,
        label: 'Listen Timeout (ms)',
        placeholder: '0',
        description: 'Time to wait for app to be ready',
        defaultValue: 0,
        group: 'timeouts'
    },
    {
        name: 'waitReady',
        type: 'boolean',
        required: false,
        label: 'Wait for Ready',
        description: 'Wait for ready signal from app before marking as started',
        defaultValue: false,
        group: 'timeouts'
    },
    
    // Logging
    {
        name: 'stdout',
        type: 'string',
        required: false,
        label: 'Stdout Log Path',
        placeholder: 'logs/app.log',
        description: 'Standard output log file path',
        group: 'logging'
    },
    {
        name: 'stderr',
        type: 'string',
        required: false,
        label: 'Stderr Log Path',
        placeholder: 'logs/error.log',
        description: 'Standard error log file path',
        group: 'logging'
    },
    {
        name: 'combineLogs',
        type: 'boolean',
        required: false,
        label: 'Combine Logs',
        description: 'Combine stdout and stderr',
        defaultValue: false,
        group: 'logging'
    },
    {
        name: 'mergeLogs',
        type: 'boolean',
        required: false,
        label: 'Merge Logs',
        description: 'Merge logs from all instances',
        defaultValue: false,
        group: 'logging'
    },
    {
        name: 'logDateFormat',
        type: 'string',
        required: false,
        label: 'Log Date Format',
        placeholder: 'YYYY-MM-DD HH:mm:ss',
        description: 'Log timestamp format',
        group: 'logging'
    },
    
    // Resources
    {
        name: 'maxMemory',
        type: 'number',
        required: false,
        label: 'Max Memory (bytes)',
        placeholder: '0',
        description: 'Max memory in bytes before auto-restart (0 = disabled)',
        defaultValue: 0,
        group: 'resources'
    },
    {
        name: 'nice',
        type: 'number',
        required: false,
        label: 'Nice Value',
        placeholder: '0',
        description: 'Process priority (-20 to 19, lower = higher priority)',
        group: 'resources'
    },
    
    // Advanced
    {
        name: 'cron',
        type: 'string',
        required: false,
        label: 'Cron Expression',
        placeholder: '0 * * * *',
        description: 'Execute as cron job',
        group: 'advanced'
    },
    {
        name: 'dotEnv',
        type: 'string',
        required: false,
        label: 'Dotenv File',
        placeholder: '.env',
        description: 'Dotenv file path',
        group: 'advanced'
    },
    {
        name: 'lbStrategy',
        type: 'string',
        required: false,
        label: 'Load Balancing Strategy',
        description: 'Strategy for clustering',
        options: [
            { value: '', label: 'Default (Round Robin)' },
            { value: 'round-robin', label: 'Round Robin' },
            { value: 'least-connections', label: 'Least Connections' },
            { value: 'weighted-round-robin', label: 'Weighted Round Robin' }
        ],
        group: 'advanced'
    }
];

/**
 * Form section definitions for UI grouping
 */
const FORM_SECTIONS = [
    { id: 'basic', label: 'Basic', defaultOpen: true },
    { id: 'runtime', label: 'Runtime', defaultOpen: false },
    { id: 'restart', label: 'Restart Behavior', defaultOpen: false },
    { id: 'watch', label: 'Watch Mode', defaultOpen: false },
    { id: 'lifecycle', label: 'Lifecycle Scripts', defaultOpen: false },
    { id: 'timeouts', label: 'Timeouts', defaultOpen: false },
    { id: 'logging', label: 'Logging', defaultOpen: false },
    { id: 'resources', label: 'Resources', defaultOpen: false },
    { id: 'advanced', label: 'Advanced', defaultOpen: false }
];

@customElement('tspm-modal')
export class TspmModal extends LitElement {
    @property({ type: Boolean }) isOpen = false;
    @property({ type: Boolean }) editMode = false;
    @property({ type: String }) processName = '';
    @property({ attribute: false }) editProcess: DumpProcess | null = null;
    
    @state() private _formData: Record<string, unknown> = {};
    @state() private _expandedSections: Set<string> = new Set(['basic']);
    @state() private _showAdvanced = false;

    open() { 
        this.isOpen = true; 
        this._resetForm();
    }
    
    close() { 
        this.isOpen = false; 
        this.editMode = false;
        this.processName = '';
        this.editProcess = null;
        this._resetForm();
        this.dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));
    }

    private _resetForm() {
        const newData: Record<string, unknown> = {};
        
        // Set default values from schema
        for (const field of PROCESS_CONFIG_FIELDS) {
            if (field.defaultValue !== undefined) {
                newData[field.name] = field.defaultValue;
            }
        }
        
        this._formData = newData;
        this._expandedSections = new Set(['basic']);
        this._showAdvanced = false;
    }

    private _populateForm() {
        if (this.editProcess) {
            const newData: Record<string, unknown> = {};
            
            // 1. Initialize with default values first
            for (const field of PROCESS_CONFIG_FIELDS) {
                if (field.defaultValue !== undefined) {
                    newData[field.name] = field.defaultValue;
                }
            }

            // 2. Copy all properties from editProcess
            for (const key of Object.keys(this.editProcess)) {
                const value = this.editProcess[key as keyof DumpProcess];
                
                // Handle special conversions
                if (key === 'instances') {
                    newData[key] = typeof value === 'string' 
                        ? parseInt(value, 10) || 1 
                        : value || 1;
                } else if (key === 'args' && Array.isArray(value)) {
                    newData[key] = [...value];
                } else if (value !== undefined) {
                    newData[key] = value;
                }
            }
            
            this._formData = newData;
        }
    }

    override updated(changedProperties: Map<string, unknown>) {
        if (changedProperties.has('isOpen') && this.isOpen && this.editProcess) {
            this._populateForm();
        }
        if (changedProperties.has('editProcess') && this.editProcess && this.isOpen) {
            this._populateForm();
        }
    }

    private _toggleSection(sectionId: string) {
        if (this._expandedSections.has(sectionId)) {
            this._expandedSections.delete(sectionId);
        } else {
            this._expandedSections.add(sectionId);
        }
        this._expandedSections = new Set(this._expandedSections);
    }

    private _handleInputChange(fieldName: string, value: unknown) {
        this._formData = {
            ...this._formData,
            [fieldName]: value
        };
    }

    private _getFieldValue(fieldName: string): unknown {
        return this._formData[fieldName];
    }

    private _renderField(field: FormFieldConfig) {
        const value = this._getFieldValue(field.name);
        
        if (field.type === 'boolean') {
            return html`
                <div class="checkbox-group">
                    <label class="checkbox-label">
                        <input
                            type="checkbox"
                            ?checked="${!!value}"
                            @change="${(e: Event) => this._handleInputChange(field.name, (e.target as HTMLInputElement).checked)}"
                        />
                        <span class="checkbox-text">
                            ${field.label}
                            ${field.description ? html`<span class="field-description">${field.description}</span>` : ''}
                        </span>
                    </label>
                </div>
            `;
        }
        
        if (field.options) {
            return html`
                <div class="form-group">
                    <label>${field.label}</label>
                    <select
                        .value="${String(value ?? '')}"
                        @change="${(e: Event) => this._handleInputChange(field.name, (e.target as HTMLSelectElement).value)}"
                    >
                        ${field.options.map(opt => html`
                            <option value="${opt.value}" ?selected="${String(value ?? '') === opt.value}">
                                ${opt.label}
                            </option>
                        `)}
                    </select>
                    ${field.description ? html`<span class="field-description">${field.description}</span>` : ''}
                </div>
            `;
        }
        
        if (field.type === 'number') {
            return html`
                <div class="form-group">
                    <label>${field.label}</label>
                    <input
                        type="number"
                        placeholder="${field.placeholder || ''}"
                        .value="${String(value ?? field.defaultValue ?? '')}"
                        @input="${(e: Event) => {
                            const val = (e.target as HTMLInputElement).value;
                            this._handleInputChange(field.name, val ? parseInt(val, 10) : field.defaultValue);
                        }}"
                    />
                    ${field.description ? html`<span class="field-description">${field.description}</span>` : ''}
                </div>
            `;
        }
        
        // String or string[] type
        return html`
            <div class="form-group">
                <label>${field.label}</label>
                <input
                    type="text"
                    placeholder="${field.placeholder || ''}"
                    .value="${Array.isArray(value) ? value.join(' ') : String(value ?? '')}"
                    @input="${(e: Event) => {
                        const val = (e.target as HTMLInputElement).value;
                        if (field.type === 'string[]') {
                            this._handleInputChange(field.name, val ? val.split(' ').filter(a => a.trim()) : []);
                        } else {
                            this._handleInputChange(field.name, val);
                        }
                    }}"
                />
                ${field.description ? html`<span class="field-description">${field.description}</span>` : ''}
            </div>
        `;
    }

    private _renderSection(section: typeof FORM_SECTIONS[0], fields: FormFieldConfig[]) {
        const isExpanded = this._expandedSections.has(section.id);
        
        return html`
            <div class="section">
                <button 
                    type="button" 
                    class="section-header"
                    @click="${() => this._toggleSection(section.id)}"
                >
                    <span class="section-icon">${isExpanded ? '▼' : '▶'}</span>
                    <span class="section-label">${section.label}</span>
                    <span class="section-count">${fields.length} fields</span>
                </button>
                ${isExpanded ? html`
                    <div class="section-content">
                        ${fields.map(field => this._renderField(field))}
                    </div>
                ` : ''}
            </div>
        `;
    }

    static override styles = css`
        :host {
            display: contents;
        }

        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        .overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        .modal {
            background: #1a1a1e;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            width: 600px;
            max-width: 95%;
            max-height: 90vh;
            overflow-y: auto;
            padding: 2rem;
            transform: scale(0.9);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .active .modal {
            transform: scale(1);
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        header h2 { margin: 0; font-size: 1.5rem; color: #fff; }

        .btn-close {
            background: none;
            border: none;
            color: #64748b;
            font-size: 1.5rem;
            cursor: pointer;
        }

        form { display: flex; flex-direction: column; gap: 1rem; }

        .form-group { display: flex; flex-direction: column; gap: 6px; }
        label { color: #94a3b8; font-size: 0.9rem; font-weight: 500; }

        input, select {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 0.75rem 1rem;
            color: #fff;
            font-family: inherit;
            font-size: 0.95rem;
        }

        input:focus, select:focus { border-color: #6366f1; outline: none; }
        
        input::placeholder { color: #475569; }

        .field-description {
            display: block;
            color: #64748b;
            font-size: 0.8rem;
            margin-top: 2px;
        }

        .checkbox-group {
            display: flex;
            align-items: flex-start;
        }

        .checkbox-label {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            cursor: pointer;
            color: #94a3b8;
            font-size: 0.9rem;
        }

        .checkbox-label input[type="checkbox"] {
            width: 18px;
            height: 18px;
            margin-top: 2px;
            accent-color: #6366f1;
        }

        .checkbox-text {
            display: flex;
            flex-direction: column;
        }

        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        .section {
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 0.5rem;
        }

        .section-header {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 0.75rem 1rem;
            background: rgba(255, 255, 255, 0.02);
            border: none;
            color: #e2e8f0;
            font-size: 0.95rem;
            font-weight: 500;
            cursor: pointer;
            text-align: left;
            transition: background 0.2s;
        }

        .section-header:hover {
            background: rgba(255, 255, 255, 0.05);
        }

        .section-icon {
            font-size: 0.7rem;
            color: #64748b;
            width: 16px;
        }

        .section-label {
            flex: 1;
        }

        .section-count {
            font-size: 0.75rem;
            color: #64748b;
            font-weight: normal;
        }

        .section-content {
            padding: 1rem;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            background: rgba(0, 0, 0, 0.2);
        }

        .section-content .form-group:only-child {
            grid-column: 1 / -1;
        }

        .advanced-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0.5rem;
            background: transparent;
            border: 1px dashed rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: #64748b;
            font-size: 0.85rem;
            cursor: pointer;
            margin-top: 0.5rem;
            transition: all 0.2s;
        }

        .advanced-toggle:hover {
            border-color: rgba(255, 255, 255, 0.2);
            color: #94a3b8;
        }

        footer {
            margin-top: 2rem;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }

        .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
        }

        .btn-cancel { background: transparent; color: #94a3b8; }
        .btn-primary { background: #6366f1; color: white; }
        .btn-primary:hover { background: #4f46e5; }

        /* Scrollbar styling */
        .modal::-webkit-scrollbar {
            width: 8px;
        }

        .modal::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
        }

        .modal::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }

        .modal::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
        }
    `;

    private async _handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        
        // Build config from form data - use a plain object initially
        const config: Record<string, unknown> = {
            name: String(this._formData.name || ''),
            script: String(this._formData.script || '')
        };

        // Add all non-empty values
        const stringFields = ['interpreter', 'cwd', 'namespace', 'stdout', 'stderr', 
            'logDateFormat', 'cron', 'dotEnv', 'lbStrategy', 'preStart', 'install', 
            'build', 'postStart'];
        
        const numberFields = ['instances', 'maxRestarts', 'minRestartDelay', 
            'maxRestartDelay', 'minUptime', 'watchDelay', 'killTimeout', 
            'listenTimeout', 'maxMemory', 'nice'];
        
        const booleanFields = ['autorestart', 'watch', 'waitReady', 'combineLogs', 'mergeLogs'];
        
        const arrayFields = ['args', 'ignoreWatch'];

        for (const field of stringFields) {
            const value = this._formData[field];
            if (value && typeof value === 'string' && value.trim()) {
                config[field] = value.trim();
            }
        }

        for (const field of numberFields) {
            const value = this._formData[field];
            if (value !== undefined && value !== null && value !== '') {
                const num = typeof value === 'number' ? value : parseInt(String(value), 10);
                if (!isNaN(num)) {
                    config[field] = num;
                }
            }
        }

        for (const field of booleanFields) {
            const value = this._formData[field];
            if (value !== undefined) {
                config[field] = Boolean(value);
            }
        }

        for (const field of arrayFields) {
            const value = this._formData[field];
            if (Array.isArray(value) && value.length > 0) {
                config[field] = value;
            } else if (typeof value === 'string' && value.trim()) {
                config[field] = value.split(' ').filter(a => a.trim());
            }
        }

        // Remove empty strings for optional fields
        ['interpreter', 'namespace', 'install', 'build'].forEach(key => {
            if (config[key] === '') {
                delete config[key];
            }
        });

        try {
            let res: Response;
            if (this.editMode && this.processName) {
                // Edit mode - PATCH request
                res = await fetch(`/api/v1/dump/${encodeURIComponent(this.processName)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                });
            } else {
                // Create mode - POST request
                res = await fetch(`/api/v1/processes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                });
            }
            const data = await res.json();
            if (data.success) {
                this.close();
                if (this.editMode) {
                    this.dispatchEvent(new CustomEvent('process-updated', { bubbles: true, composed: true }));
                } else {
                    this.dispatchEvent(new CustomEvent('process-added', { bubbles: true, composed: true }));
                }
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert(this.editMode ? 'Failed to update process' : 'Failed to spawn process');
        }
    }

    override render() {
        const title = this.editMode ? 'Edit Process' : 'Process Configuration';
        const submitLabel = this.editMode ? 'Save Changes' : 'Spawn Instance';
        
        // Get fields by section
        const getFieldsBySection = (sectionId: string) => 
            PROCESS_CONFIG_FIELDS.filter(f => f.group === sectionId);

        return html`
            <div class="overlay ${this.isOpen ? 'active' : ''}" @click="${(e: MouseEvent) => e.target === e.currentTarget && this.close()}">
                <div class="modal">
                    <header>
                        <h2>${title}</h2>
                        <button class="btn-close" @click="${this.close}">&times;</button>
                    </header>
                    <form @submit="${this._handleSubmit}">
                        ${FORM_SECTIONS.map(section => {
                            const fields = getFieldsBySection(section.id);
                            if (fields.length === 0) return null;
                            return this._renderSection(section, fields);
                        })}
                        <footer>
                            <button type="button" class="btn btn-cancel" @click="${this.close}">Cancel</button>
                            <button type="submit" class="btn btn-primary">${submitLabel}</button>
                        </footer>
                    </form>
                </div>
            </div>
        `;
    }
}
