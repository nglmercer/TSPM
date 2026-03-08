import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ProcessStatus } from '../types';

@customElement('tspm-process-card')
export class TspmProcessCard extends LitElement {
    @property({ type: Object }) process: ProcessStatus = {
        name: '',
        cpu: 0,
        memory: 0
    };

    static override styles = css`
        :host {
            display: block;
        }

        .card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 1.25rem;
            transition: all 0.2s ease;
        }

        .card:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(99, 102, 241, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.25rem;
        }

        .info h4 {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
            color: #fff;
        }

        .pid {
            font-size: 0.75rem;
            color: #64748b;
            font-family: 'JetBrains Mono', monospace;
            margin-top: 4px;
        }

        .status-badge {
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            padding: 4px 10px;
            border-radius: 20px;
            letter-spacing: 0.5px;
        }

        .status-running {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .status-stopped {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1.5rem;
            background: rgba(0, 0, 0, 0.2);
            padding: 0.875rem;
            border-radius: 12px;
        }

        .stat-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.85rem;
            color: #94a3b8;
        }

        .stat-item i {
            width: 14px;
            height: 14px;
            color: #6366f1;
        }

        .stat-item span {
            color: #e2e8f0;
            font-weight: 500;
        }

        .actions {
            display: flex;
            gap: 8px;
        }

        .btn-icon {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.6rem;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            color: #94a3b8;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-icon:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #fff;
            border-color: rgba(255, 255, 255, 0.1);
        }

        .btn-icon.restart:hover { color: #818cf8; border-color: rgba(129, 140, 248, 0.3); }
        .btn-icon.stop:hover { color: #f87171; border-color: rgba(248, 113, 113, 0.3); }
        .btn-icon.start:hover { color: #34d399; border-color: rgba(52, 211, 153, 0.3); }
        .btn-icon.edit:hover { color: #fbbf24; border-color: rgba(251, 191, 36, 0.3); }
        .btn-icon.delete:hover { color: #f87171; border-color: rgba(248, 113, 113, 0.3); }

        .btn-icon i {
            width: 18px;
            height: 18px;
        }
    `;

    private formatBytes(bytes: number) {
        if (!bytes) return '0 B';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
    }

    private async action(type: string) {
        try {
            const encodedName = encodeURIComponent(this.process.name);
            const res = await fetch(`/api/v1/processes/${encodedName}/${type}`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                this.dispatchEvent(new CustomEvent('refresh-required', { bubbles: true, composed: true }));
            } else {
                this.dispatchEvent(new CustomEvent('show-notification', {
                    detail: { message: data.error || `Failed to ${type}`, type: 'error' },
                    bubbles: true,
                    composed: true
                }));
            }
        } catch (err) {
            this.dispatchEvent(new CustomEvent('show-notification', {
                detail: { message: `Network error while trying to ${type}`, type: 'error' },
                bubbles: true,
                composed: true
            }));
            console.error('Action failed', err);
        }
    }

    override render() {
        const p = this.process;
        return html`
            <div class="card">
                <div class="card-header">
                    <div class="info">
                        <h4>${p.name}</h4>
                        <div class="pid">PID: ${p.pid || 'N/A'}</div>
                    </div>
                    <span class="status-badge status-${p.state}">${p.state}</span>
                </div>

                <div class="stats">
                    <div class="stat-item">
                        <i data-lucide="activity"></i>
                        <span>${p.cpu || 0}%</span>
                    </div>
                    <div class="stat-item">
                        <i data-lucide="database"></i>
                        <span>${this.formatBytes(p.memory || 0)}</span>
                    </div>
                </div>

                <div class="actions">
                    <button class="btn-icon start" title="Start" @click="${() => this.action('start')}" ?disabled="${p.state === 'running'}">
                        <i data-lucide="play"></i>
                    </button>
                    <button class="btn-icon stop" title="Stop" @click="${() => this.action('stop')}" ?disabled="${p.state !== 'running'}">
                        <i data-lucide="square"></i>
                    </button>
                    <button class="btn-icon restart" title="Restart" @click="${() => this.action('restart')}">
                        <i data-lucide="refresh-ccw"></i>
                    </button>
                    <button class="btn-icon" title="Logs" @click="${() => this.dispatchEvent(new CustomEvent('view-logs', { detail: p.name, bubbles: true, composed: true }))}">
                        <i data-lucide="file-text"></i>
                    </button>
                    <button class="btn-icon edit" title="Edit Config" @click="${() => this.dispatchEvent(new CustomEvent('edit-process-config', { detail: p.name, bubbles: true, composed: true }))}">
                        <i data-lucide="edit"></i>
                    </button>
                    <button class="btn-icon delete" title="Delete Process" @click="${() => this.dispatchEvent(new CustomEvent('delete-process', { detail: p.name, bubbles: true, composed: true }))}">
                        <i data-lucide="trash-2"></i>
                    </button>
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

