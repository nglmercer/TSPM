import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';

@customElement('tspm-logs')
export class TspmLogs extends LitElement {
    @property({ type: Array }) processes: any[] = [];
    @property({ type: String }) selectedProcess = 'all';
    @state() private logs: any[] = [];

    @query('.output') private outputEl?: HTMLElement;

    constructor() {
        super();
        this._setupListeners();
    }

    private _setupListeners() {
        window.addEventListener('new-log', (e: any) => {
            this.logs = [...this.logs.slice(-999), e.detail];
            this._scrollToBottom();
        });
    }

    static override styles = css`
        :host {
            display: block;
            height: 100%;
        }

        .container {
            background: rgba(15, 15, 20, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            height: 600px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .header {
            padding: 1rem;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        select {
            background: #1a1a1a;
            color: #fff;
            border: 1px solid #333;
            padding: 6px 12px;
            border-radius: 8px;
            font-family: inherit;
        }

        .output {
            flex: 1;
            padding: 1rem;
            overflow-y: auto;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.85rem;
            scrollbar-width: thin;
        }

        .output::-webkit-scrollbar { width: 6px; }
        .output::-webkit-scrollbar-thumb { background: #333; }

        .line {
            margin-bottom: 4px;
            display: flex;
            gap: 12px;
        }

        .timestamp { color: #64748b; min-width: 80px; }
        .proc { color: #818cf8; font-weight: 600; min-width: 100px; }
        .msg { color: #e2e8f0; white-space: pre-wrap; word-break: break-all; }

        .controls { display: flex; gap: 10px; }
        .btn-icon {
            background: transparent;
            border: none;
            color: #64748b;
            cursor: pointer;
            padding: 4px;
        }
        .btn-icon:hover { color: #fff; }
    `;

    private _scrollToBottom() {
        if (this.outputEl) {
            this.outputEl.scrollTop = this.outputEl.scrollHeight;
        }
    }

    override render() {
        const filteredLogs = this.selectedProcess === 'all' 
            ? this.logs 
            : this.logs.filter(l => l.processName === this.selectedProcess);

        return html`
            <div class="container">
                <div class="header">
                    <select @change="${(e: any) => this.selectedProcess = e.target.value}">
                        <option value="all">Global Logs</option>
                        ${this.processes.map(p => html`<option value="${p.name}" ?selected="${this.selectedProcess === p.name}">${p.name}</option>`)}
                    </select>
                    <div class="controls">
                        <button class="btn-icon" title="Clear" @click="${() => this.logs = []}">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
                <div class="output">
                    ${filteredLogs.map(log => html`
                        <div class="line">
                            <span class="timestamp">[${new Date().toLocaleTimeString()}]</span>
                            <span class="proc">[${log.processName}]</span>
                            <span class="msg">${log.message}</span>
                        </div>
                    `)}
                </div>
            </div>
        `;
    }

    override updated() {
        const lucide = (window as any).lucide;
        if (lucide) {
            lucide.createIcons({
                attrs: { 'stroke-width': 2, 'class': 'lucide-icon' },
                root: this.shadowRoot
            });
        }
    }
}

