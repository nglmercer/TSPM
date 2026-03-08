import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('tspm-sidebar')
export class TspmSidebar extends LitElement {
    @property({ type: String }) currentView = 'dashboard';
    @property({ type: Boolean }) isOnline = false;

    static override styles = css`
        :host {
            background: rgba(15, 15, 20, 0.8);
            backdrop-filter: blur(12px);
            border-right: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            flex-direction: column;
            padding: 1.5rem 1rem;
            z-index: 100;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 1rem;
            margin-bottom: 2rem;
        }

        .logo-icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .logo-text {
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: -0.5px;
            color: #fff;
        }

        .nav-links {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            flex: 1;
        }

        .nav-btn {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0.875rem 1rem;
            border: none;
            background: transparent;
            color: #94a3b8;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 0.95rem;
            font-weight: 500;
            text-align: left;
            width: 100%;
        }

        .nav-btn:hover {
            background: rgba(255, 255, 255, 0.03);
            color: #fff;
        }

        .nav-btn.active {
            background: rgba(99, 102, 241, 0.1);
            color: #818cf8;
        }

        .nav-btn i {
            width: 20px;
            height: 20px;
        }

        .sidebar-footer {
            margin-top: auto;
            padding: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .system-status {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.85rem;
            color: #64748b;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #475569;
        }

        .status-dot.online {
            background: #10b981;
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
        }

        @media (max-width: 768px) {
            .logo-text, .nav-btn span, .system-status span {
                display: none;
            }
            .nav-btn {
                justify-content: center;
                padding: 1rem;
            }
            .logo {
                justify-content: center;
                padding: 1rem 0;
            }
        }
    `;

    private _changeView(view: string) {
        this.dispatchEvent(new CustomEvent('view-change', { detail: { view } }));
    }

    override render() {
        return html`
            <div class="logo">
                <div class="logo-icon">T</div>
                <span class="logo-text">TSPM</span>
            </div>

            <div class="nav-links">
                <button class="nav-btn ${this.currentView === 'dashboard' ? 'active' : ''}" @click="${() => this._changeView('dashboard')}">
                    <i data-lucide="layout-dashboard"></i>
                    <span>Dashboard</span>
                </button>
                <button class="nav-btn ${this.currentView === 'processes' ? 'active' : ''}" @click="${() => this._changeView('processes')}">
                    <i data-lucide="cpu"></i>
                    <span>Processes</span>
                </button>
                <button class="nav-btn ${this.currentView === 'terminal' ? 'active' : ''}" @click="${() => this._changeView('terminal')}">
                    <i data-lucide="terminal"></i>
                    <span>Executor</span>
                </button>
                <button class="nav-btn ${this.currentView === 'logs' ? 'active' : ''}" @click="${() => this._changeView('logs')}">
                    <i data-lucide="file-text"></i>
                    <span>Live Logs</span>
                </button>
                <button class="nav-btn ${this.currentView === 'profiles' ? 'active' : ''}" @click="${() => this._changeView('profiles')}">
                    <i data-lucide="folder-cog"></i>
                    <span>Profiles</span>
                </button>
            </div>

            <div class="sidebar-footer">
                <div class="system-status">
                    <div class="status-dot ${this.isOnline ? 'online' : ''}"></div>
                    <span>System ${this.isOnline ? 'Online' : 'Offline'}</span>
                </div>
            </div>
        `;
    }

    override updated() {
        // Lucide icons need to be initialized after render
        if (this.shadowRoot && window.lucide) {
            window.lucide.createIcons({
                attrs: {
                    'stroke-width': 2,
                    'class': 'lucide-icon'
                },
                nameAttr: 'data-lucide',
                root: this.shadowRoot
            });
        }
    }
}

