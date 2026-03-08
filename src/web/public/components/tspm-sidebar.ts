import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('tspm-sidebar')
export class TspmSidebar extends LitElement {
    @property({ type: String }) currentView = 'dashboard';
    @property({ type: Boolean }) isOnline = false;
    @property({ type: Boolean }) collapsed = false;

    static override styles = css`
        :host {
            background: rgba(15, 15, 20, 0.8);
            backdrop-filter: blur(12px);
            border-right: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            flex-direction: column;
            padding: 1.5rem 0.75rem;
            z-index: 100;
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            width: 260px;
            box-sizing: border-box;
        }

        :host([collapsed]) {
            width: 80px;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0.75rem;
            margin-bottom: 2rem;
            overflow: hidden;
            white-space: nowrap;
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
            flex-shrink: 0;
        }

        .logo-text {
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: -0.5px;
            color: #fff;
            transition: opacity 0.2s;
        }

        :host([collapsed]) .logo-text {
            opacity: 0;
            pointer-events: none;
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
            padding: 0.875rem;
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
            overflow: hidden;
            white-space: nowrap;
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
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .nav-btn span {
            transition: opacity 0.2s;
        }

        :host([collapsed]) .nav-btn {
            justify-content: center;
            padding: 0.875rem 0;
        }

        :host([collapsed]) .nav-btn span {
            opacity: 0;
            width: 0;
            display: none;
        }

        .sidebar-footer {
            margin-top: auto;
            padding: 1rem 0.5rem;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            overflow: hidden;
        }

        .system-status {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.85rem;
            color: #64748b;
            white-space: nowrap;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #475569;
            flex-shrink: 0;
        }

        :host([collapsed]) .system-status span {
            display: none;
        }

        .status-dot.online {
            background: #10b981;
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
        }

        @media (max-width: 768px) {
            :host {
                position: fixed;
                top: 0;
                bottom: 0;
                left: 0;
                transform: translateX(-100%);
                transition: transform 0.3s ease;
                width: 240px;
            }
            :host([active]) {
                transform: translateX(0);
                box-shadow: 20px 0 50px rgba(0,0,0,0.5);
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

