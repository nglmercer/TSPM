import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ProcessStatus, SystemStats } from '../types';

@customElement('tspm-dashboard')
export class TspmDashboard extends LitElement {
    @property({ type: Array }) processes: ProcessStatus[] | undefined = undefined;
    @property({ type: Object }) stats: SystemStats = { cpu: 0, memory: 0, uptime: 0 };

    static override styles = css`
        :host {
            display: block;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2.5rem;
        }

        .stat-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 1.5rem;
            position: relative;
            overflow: hidden;
            transition: transform 0.2s ease, background 0.2s ease;
        }

        .stat-card:hover {
            background: rgba(255, 255, 255, 0.05);
            transform: translateY(-2px);
        }

        .stat-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }

        .stat-header h3 {
            margin: 0;
            font-size: 0.9rem;
            font-weight: 500;
            color: #94a3b8;
        }

        .stat-header i {
            color: #6366f1;
            width: 20px;
            height: 20px;
        }

        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #fff;
            margin-bottom: 0.5rem;
        }

        .stat-footer {
            font-size: 0.85rem;
        }

        .text-success { color: #10b981; }
        .text-muted { color: #64748b; }

        .progress-bar {
            height: 4px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 2px;
            margin-top: 1rem;
            overflow: hidden;
        }

        .progress {
            height: 100%;
            background: linear-gradient(90deg, #6366f1, #a855f7);
            border-radius: 2px;
            transition: width 0.3s ease;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .section-header h2 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
        }

        .process-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1.5rem;
        }

        .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4rem;
            color: #64748b;
            grid-column: 1 / -1;
        }

        .spin {
            animation: spin 2s linear infinite;
            width: 32px;
            height: 32px;
            margin-bottom: 1rem;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;

    private formatBytes(bytes: number) {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    override render() {
        const processes = this.processes ?? [];
        const totalCpu = processes.reduce((acc, p) => acc + (p.cpu || 0), 0);
        const totalMem = processes.reduce((acc, p) => acc + (p.memory || 0), 0);

        return html`
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Total Processes</h3>
                        <i data-lucide="layers"></i>
                    </div>
                    <div class="stat-value">${processes.length}</div>
                    <div class="stat-footer">
                        <span class="text-success">Active & Monitoring</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Active CPU Usage</h3>
                        <i data-lucide="activity"></i>
                    </div>
                    <div class="stat-value">${Math.round(totalCpu)}%</div>
                    <div class="stat-footer">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${Math.min(100, totalCpu)}%"></div>
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Total Memory</h3>
                        <i data-lucide="database"></i>
                    </div>
                    <div class="stat-value">${this.formatBytes(totalMem)}</div>
                    <div class="stat-footer">
                        <span class="text-muted">Total allocated</span>
                    </div>
                </div>
            </div>

            <div class="section-header">
                <h2>Running Processes</h2>
            </div>

            <div class="process-grid">
                ${processes.length === 0 ? html`
                    <div class="loading-state">
                        <i data-lucide="loader-2" class="spin"></i>
                        <p>Waiting for process data...</p>
                    </div>
                ` : processes.map(p => html`
                    <tspm-process-card .process="${p}"></tspm-process-card>
                `)}
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

