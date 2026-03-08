import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { ProcessFormConfig, DumpProcess } from '../types';

@customElement('tspm-modal')
export class TspmModal extends LitElement {
    @property({ type: Boolean }) isOpen = false;
    @property({ type: Boolean }) editMode = false;
    @property({ type: String }) processName = '';
    @property({ attribute: false }) editProcess: DumpProcess | null = null;
    @state() private _formName = '';
    @state() private _formScript = '';
    @state() private _formInterpreter = '';
    @state() private _formInstances = 1;
    @state() private _formArgs = '';
    @state() private _formNamespace = '';

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
        this._formName = '';
        this._formScript = '';
        this._formInterpreter = '';
        this._formInstances = 1;
        this._formArgs = '';
        this._formNamespace = '';
    }

    private _populateForm() {
        if (this.editProcess) {
            this._formName = this.editProcess.name || '';
            this._formScript = this.editProcess.script || '';
            this._formInterpreter = this.editProcess.interpreter || '';
            this._formInstances = typeof this.editProcess.instances === 'string' 
                ? parseInt(this.editProcess.instances, 10) || 1 
                : this.editProcess.instances || 1;
            this._formArgs = this.editProcess.args ? this.editProcess.args.join(' ') : '';
            this._formNamespace = this.editProcess.namespace || '';
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
            width: 500px;
            max-width: 90%;
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

        form { display: flex; flex-direction: column; gap: 1.5rem; }

        .form-group { display: flex; flex-direction: column; gap: 8px; }
        label { color: #94a3b8; font-size: 0.9rem; font-weight: 500; }

        input, select {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 0.75rem 1rem;
            color: #fff;
            font-family: inherit;
        }

        input:focus { border-color: #6366f1; outline: none; }

        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        footer {
            margin-top: 2.5rem;
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
    `;

    private async _handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const config: ProcessFormConfig = {
            name: String(formData.get('name') || ''),
            script: String(formData.get('script') || ''),
            interpreter: String(formData.get('interpreter') || ''),
            instances: Number(formData.get('instances') || 1),
            namespace: String(formData.get('namespace') || '')
        };

        if (config.interpreter === '') {
            delete config.interpreter;
        }
        if (config.namespace === '') {
            delete config.namespace;
        }

        const argsStr = String(formData.get('args') || '');
        if (argsStr.trim()) {
            config.args = argsStr.split(' ').filter((a) => a.trim() !== '');
        }

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
        
        return html`
            <div class="overlay ${this.isOpen ? 'active' : ''}" @click="${(e: MouseEvent) => e.target === e.currentTarget && this.close()}">
                <div class="modal">
                    <header>
                        <h2>${title}</h2>
                        <button class="btn-close" @click="${this.close}">&times;</button>
                    </header>
                    <form @submit="${this._handleSubmit}">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" name="name" placeholder="my-awesome-api" required .value="${this._formName}" @input="${(e: Event) => this._formName = (e.target as HTMLInputElement).value}" />
                        </div>
                        <div class="form-group">
                            <label>Script, Command or Binary</label>
                            <input type="text" name="script" placeholder="./src/index.ts or bun run start" required .value="${this._formScript}" @input="${(e: Event) => this._formScript = (e.target as HTMLInputElement).value}" />
                        </div>
                        <div class="row">
                            <div class="form-group">
                                <label>Interpreter</label>
                                <select name="interpreter" .value="${this._formInterpreter}" @change="${(e: Event) => this._formInterpreter = (e.target as HTMLSelectElement).value}">
                                    <option value="">Auto-detect</option>
                                    <option value="bun">Bun</option>
                                    <option value="node">Node</option>
                                    <option value="python">Python</option>
                                    <option value="sh">Shell (sh)</option>
                                    <option value="none">None (Binary)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Instances</label>
                                <input type="number" name="instances" value="1" min="1" .value="${String(this._formInstances)}" @input="${(e: Event) => this._formInstances = parseInt((e.target as HTMLInputElement).value, 10) || 1}" />
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group">
                                <label>Arguments (Space separated)</label>
                                <input type="text" name="args" placeholder="--port 8080" .value="${this._formArgs}" @input="${(e: Event) => this._formArgs = (e.target as HTMLInputElement).value}" />
                            </div>
                            <div class="form-group">
                                <label>Namespace</label>
                                <input type="text" name="namespace" placeholder="production" .value="${this._formNamespace}" @input="${(e: Event) => this._formNamespace = (e.target as HTMLInputElement).value}" />
                            </div>
                        </div>
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
