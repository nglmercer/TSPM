import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ProcessStatus } from '../types';

@customElement('tspm-process-table')
export class TspmProcessTable extends LitElement {
    @property({ type: Array }) processes: ProcessStatus[] = [];

    static override styles = css`
        :host {
            display: block;
        }

        .table-container {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.9rem;
        }

        th {
            background: rgba(255, 255, 255, 0.02);
            padding: 1.25rem 1.5rem;
            color: #94a3b8;
            font-weight: 500;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        td {
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            color: #e2e8f0;
        }

        tr:last-child td {
            border-bottom: none;
        }

        tr:hover td {
            background: rgba(255, 255, 255, 0.01);
        }

        .status-badge {
            font-size: 0.75rem;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: 600;
        }

        .status-running { color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .status-stopped { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

        .font-mono {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.8rem;
            color: #94a3b8;
        }

        .actions {
            display: flex;
            gap: 8px;
        }

        .btn-icon {
            padding: 6px;
            background: transparent;
            border: none;
            color: #64748b;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.2s;
        }

        .btn-icon:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.05);
        }
    `;

    private formatBytes(bytes: number) {
        if (!bytes) return '0 B';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
    }

    override render() {
        return html`
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Status</th>
                            <th>PID</th>
                            <th>Memory</th>
                            <th>CPU</th>
                            <th>Uptime</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.processes.map(p => html`
                            <tr>
                                <td style="font-weight: 600;">${p.name}</td>
                                <td><span class="status-badge status-${p.state}">${p.state}</span></td>
                                <td class="font-mono">#${p.pid || '-'}</td>
                                <td>${this.formatBytes(p.memory || 0)}</td>
                                <td>${p.cpu || 0}%</td>
                                <td>${this.formatUptime(p.uptime)}</td>
                                <td>
                                    <div class="actions">
                                        <button class="btn-icon" @click="${() => this._action(p.name, 'restart')}"><i data-lucide="refresh-ccw" style="width:16px"></i></button>
                                        <button class="btn-icon" @click="${() => this._action(p.name, p.state === 'running' ? 'stop' : 'start')}">
                                            <i data-lucide="${p.state === 'running' ? 'square' : 'play'}" style="width:16px"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `)}
                    </tbody>
                </table>
            </div>
        `;
    }

    private formatUptime(ms?: number) {
        if (!ms) return '-';
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        const h = Math.floor(m / 60);
        return `${h}h ${m % 60}m`;
    }

    private async _action(name: string, action: string) {
        const encodedName = encodeURIComponent(name);
        await fetch(`/api/v1/processes/${encodedName}/${action}`, { method: 'POST' });
        this.dispatchEvent(new CustomEvent('refresh-required', { bubbles: true, composed: true }));
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

