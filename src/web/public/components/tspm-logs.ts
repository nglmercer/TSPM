import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import type { ProcessStatus, ProcessLogEntry } from '../types';

@customElement('tspm-logs')
export class TspmLogs extends LitElement {
    @property({ type: Array }) processes: ProcessStatus[] = [];
    @property({ type: String }) selectedProcess = 'all';
    @state() private logs: ProcessLogEntry[] = [];
    @state() private loading = false;

    @query('.output') private outputEl?: HTMLElement;

    private _refreshTimer?: ReturnType<typeof setInterval>;

    constructor() {
        super();
        this._setupListeners();
    }

    override connectedCallback() {
        super.connectedCallback();
        this._fetchLogs();
        this._refreshTimer = setInterval(() => this._fetchLogs(), 5000);
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        if (this._refreshTimer) clearInterval(this._refreshTimer);
    }

    private async _fetchLogs() {
        const url = this.selectedProcess === 'all'
            ? '/api/v1/logs?limit=200'
            : `/api/v1/processes/${encodeURIComponent(this.selectedProcess)}/logs?limit=200`;

        this.loading = true;
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.success && data.data) {
                const raw: ProcessLogEntry[] = data.data.logs ?? [];
                // Per-process endpoint entries may lack processName — fill it in
                this.logs = raw.map(e => ({
                    ...e,
                    processName: e.processName || (this.selectedProcess !== 'all' ? this.selectedProcess : '?'),
                }));
                this.requestUpdate();
                setTimeout(() => this._scrollToBottom(), 80);
            }
        } catch (err) {
            console.error('Failed to fetch logs', err);
        } finally {
            this.loading = false;
        }
    }

    private _handleProcessChange(e: Event) {
        this.selectedProcess = (e.target as HTMLSelectElement).value;
        this.logs = [];
        this._fetchLogs();
    }

    private _setupListeners() {
        window.addEventListener('new-log', ((e: CustomEvent<ProcessLogEntry>) => {
            const entry = e.detail;
            if (this.selectedProcess === 'all' || entry.processName === this.selectedProcess) {
                this.logs = [...this.logs.slice(-999), entry];
                setTimeout(() => this._scrollToBottom(), 50);
            }
        }) as EventListener);
    }

    /** Format ISO timestamp → HH:MM:SS */
    private _fmtTime(ts?: string): string {
        if (!ts) return '--:--:--';
        try {
            return new Date(ts).toLocaleTimeString(undefined, { hour12: false });
        } catch {
            return (ts.substring(11, 19) || ts);
        }
    }

    /** Shorten a process name to the last path segment */
    private _shortName(name?: string): string {
        if (!name) return '?';
        const parts = name.replace(/\\/g, '/').split('/');
        return parts[parts.length - 1] || name;
    }

    static override styles = css`
        :host { display: block; height: 100%; }

        .container {
            background: rgba(15, 15, 20, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            height: 620px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .header {
            padding: 0.75rem 1rem;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            flex-shrink: 0;
        }

        select {
            background: #1a1a2e;
            color: #e2e8f0;
            border: 1px solid rgba(99, 102, 241, 0.3);
            padding: 6px 12px;
            border-radius: 8px;
            font-family: inherit;
            font-size: 0.88rem;
            max-width: 240px;
        }
        select:focus { outline: none; border-color: #6366f1; }

        .controls { display: flex; gap: 8px; align-items: center; }

        .badge {
            font-size: 0.72rem;
            background: rgba(99, 102, 241, 0.15);
            color: #818cf8;
            border: 1px solid rgba(99, 102, 241, 0.2);
            padding: 2px 8px;
            border-radius: 20px;
            white-space: nowrap;
        }

        .spin-icon {
            width: 15px; height: 15px;
            color: #6366f1;
            animation: spin 1.2s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .btn-icon {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.06);
            color: #64748b;
            cursor: pointer;
            padding: 5px 8px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            transition: all 0.15s ease;
        }
        .btn-icon:hover { color: #fff; background: rgba(255, 255, 255, 0.06); }
        .btn-icon i { width: 15px; height: 15px; }

        .output {
            flex: 1;
            padding: 0.65rem 1rem;
            overflow-y: auto;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 0.79rem;
            line-height: 1.65;
            scrollbar-width: thin;
            scrollbar-color: #2d2d44 transparent;
        }
        .output::-webkit-scrollbar { width: 5px; }
        .output::-webkit-scrollbar-thumb { background: #2d2d44; border-radius: 4px; }

        .line {
            display: grid;
            grid-template-columns: 72px 128px 1fr;
            gap: 10px;
            padding: 1px 4px;
            border-radius: 4px;
        }
        .line:hover { background: rgba(255, 255, 255, 0.025); }

        .timestamp { color: #475569; white-space: nowrap; }
        .proc {
            color: #818cf8;
            font-weight: 600;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .msg { color: #cbd5e1; white-space: pre-wrap; word-break: break-word; }
        .msg.stderr { color: #f87171; }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #475569;
            gap: 0.5rem;
            font-size: 0.9rem;
        }
        .empty-state svg { width: 32px; height: 32px; margin-bottom: 0.5rem; opacity: 0.5; }
    `;

    private _scrollToBottom() {
        if (this.outputEl) this.outputEl.scrollTop = this.outputEl.scrollHeight;
    }

    override render() {
        const logs = this.logs ?? [];
        const filteredLogs = this.selectedProcess === 'all'
            ? logs
            : logs.filter(l => l && (l.processName === this.selectedProcess || !l.processName));

        return html`
            <div class="container">
                <div class="header">
                    <select @change="${this._handleProcessChange}">
                        <option value="all">Global Logs</option>
                        ${(this.processes ?? []).map(p => html`
                            <option value="${p.name}" ?selected="${this.selectedProcess === p.name}">
                                ${this._shortName(p.name)}
                            </option>
                        `)}
                    </select>

                    <div class="controls">
                        <span class="badge">${filteredLogs.length} lines</span>
                        ${this.loading ? html`
                            <svg class="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                            </svg>` : ''}
                        <button class="btn-icon" title="Refresh" @click="${this._fetchLogs}">
                            <i data-lucide="refresh-cw"></i>
                        </button>
                        <button class="btn-icon" title="Clear" @click="${() => { this.logs = []; }}">
                            <i data-lucide="trash-2"></i>
                        </button>
                        <button class="btn-icon" title="Scroll to bottom" @click="${() => this._scrollToBottom()}">
                            <i data-lucide="arrow-down"></i>
                        </button>
                    </div>
                </div>

                <div class="output">
                    ${filteredLogs.length === 0
                        ? html`
                            <div class="empty-state">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
                                </svg>
                                <p>No logs — start a process and its output will appear here</p>
                            </div>`
                        : filteredLogs.filter(Boolean).map(log => html`
                            <div class="line">
                                <span class="timestamp">${this._fmtTime(log!.timestamp)}</span>
                                <span class="proc" title="${log!.processName || ''}">${this._shortName(log!.processName)}</span>
                                <span class="msg">${log!.message || ''}</span>
                            </div>
                        `)
                    }
                </div>
            </div>
        `;
    }

    override updated() {
        if (this.shadowRoot && window.lucide) {
            window.lucide.createIcons({
                attrs: { 'stroke-width': 2, 'class': 'lucide-icon' },
                root: this.shadowRoot
            });
        }
    }
}
