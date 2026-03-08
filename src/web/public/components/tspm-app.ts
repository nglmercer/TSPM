import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import type { ProcessStatus, SystemStats, WebSocketMessage, ProcessUpdatePayload, ViewChangeDetail, TerminalInstance, TerminalEntry } from '../types';
// Note: TspmLogs and TspmModal types are used for query selector typing
// They are imported dynamically via lit decorators query
import type { TspmLogs } from './tspm-logs';
import type { TspmModal } from './tspm-modal';
import type { TspmNotification, ToastOptions } from './tspm-notification';
import './tspm-notification';
import './tspm-terminal';

@customElement('tspm-app')
export class TspmApp extends LitElement {
    @state() currentView = 'dashboard';
    @state() processes: ProcessStatus[] = [];
    @state() systemStats: SystemStats = { cpu: 0, memory: 0, uptime: 0 };
    @state() isOnline = false;
    @state() sidebarCollapsed = false;
    @state() sidebarActive = false; // For mobile toggle
    
    // Terminal state
    @state() terminals: TerminalInstance[] = [];
    @state() activeTerminalId = '';

    private socket?: WebSocket;

    @query('tspm-modal') modal!: TspmModal;
    @query('tspm-notification') notifications!: TspmNotification;

    constructor() {
        super();
        this.connect();
        this._initTerminals();
        this._setupRouting();

        this.addEventListener('view-logs', ((e: CustomEvent<string>) => {
            this._navigateTo('logs');
            // Wait for update then set the selected process
            this.updateComplete.then(() => {
                const logsComp = this.shadowRoot?.querySelector('tspm-logs') as TspmLogs | null;
                if (logsComp) logsComp.selectedProcess = e.detail;
            });
        }) as EventListener);

        this.addEventListener('refresh-required', () => this.fetchData());

        this.addEventListener('edit-process-config', ((e: CustomEvent<string>) => {
            this._handleEditProcess(e.detail);
        }) as EventListener);

        this.addEventListener('delete-process', ((e: CustomEvent<string>) => {
            this._handleDeleteProcess(e.detail);
        }) as EventListener);

        this.addEventListener('show-notification', ((e: CustomEvent<ToastOptions>) => {
            this.notifications.show(e.detail);
        }) as EventListener);

        this.addEventListener('toggle-sidebar', () => {
            if (window.innerWidth <= 768) {
                this.sidebarActive = !this.sidebarActive;
            } else {
                this.sidebarCollapsed = !this.sidebarCollapsed;
            }
        });
        
        this.addEventListener('view-change', ((e: CustomEvent<ViewChangeDetail>) => {
            this._navigateTo(e.detail.view);
            if (window.innerWidth <= 768) {
                this.sidebarActive = false;
            }
        }) as EventListener);

        this.addEventListener('terminal-change', ((e: CustomEvent<TerminalInstance>) => {
            const index = this.terminals.findIndex(t => t.id === e.detail.id);
            if (index !== -1) {
                this.terminals[index] = { ...this.terminals[index], ...e.detail };
                this.requestUpdate('terminals');
            }
        }) as EventListener);

        this.addEventListener('close-terminal', ((e: CustomEvent<{ id: string }>) => {
            this._closeTerminal(e.detail.id);
        }) as EventListener);
    }

    private _initTerminals() {
        if (this.terminals.length === 0) {
            const id = Math.random().toString(36).substring(7);
            this.terminals = [{ id, title: 'Main', history: [], cwd: '' }];
            this.activeTerminalId = id;
        }
    }

    private _addTerminal() {
        const id = Math.random().toString(36).substring(7);
        this.terminals = [...this.terminals, { id, title: `Terminal ${this.terminals.length + 1}`, history: [], cwd: '' }];
        this.activeTerminalId = id;
        this._navigateTo(`terminal/${id}`);
    }

    private _closeTerminal(id: string) {
        if (this.terminals.length <= 1) {
            // Reset the only terminal instead of closing
            const term = this.terminals.find(t => t.id === id);
            if (term) {
                term.history = [];
                term.cwd = '';
                this.terminals = [...this.terminals];
                this.notifications.show({ message: 'Terminal reset', type: 'info' });
            }
            return;
        }

        const index = this.terminals.findIndex(t => t.id === id);
        this.terminals = this.terminals.filter(t => t.id !== id);
        
        if (this.activeTerminalId === id && this.terminals.length > 0) {
            const newIndex = Math.max(0, index - 1);
            const nextTerminal = this.terminals[newIndex];
            if (nextTerminal) {
                this.activeTerminalId = nextTerminal.id;
                this._navigateTo(`terminal/${this.activeTerminalId}`);
            }
        }
    }

    private _setupRouting() {
        const handleHash = () => {
            const hash = window.location.hash.substring(2) || 'dashboard';
            if (hash.startsWith('terminal/')) {
                const id = hash.substring(9);
                this.currentView = 'terminal';
                if (this.terminals.some(t => t.id === id)) {
                    this.activeTerminalId = id;
                } else {
                    // If terminal doesn't exist, go to first one
                    this.activeTerminalId = this.terminals[0]?.id || '';
                }
            } else if (hash === 'terminal') {
                this.currentView = 'terminal';
                if (!this.activeTerminalId && this.terminals.length > 0) {
                    this.activeTerminalId = this.terminals[0]?.id || '';
                }
                if (this.activeTerminalId) {
                    this._navigateTo(`terminal/${this.activeTerminalId}`);
                }
            } else {
                this.currentView = hash;
            }
        };

        window.addEventListener('hashchange', handleHash);
        handleHash();
    }

    private _navigateTo(view: string) {
        window.location.hash = `#/${view}`;
    }

    private async _handleEditProcess(name: string) {
        try {
            const res = await fetch(`/api/v1/dump`);
            const d = await res.json();
            if (d.success) {
                const processes = d.data?.processes ?? [];
                const proc = processes.find((p: any) => p.name === name);
                if (proc) {
                    this.modal.processName = name;
                    this.modal.editProcess = proc;
                    this.modal.editMode = true;
                    this.modal.isOpen = true;
                } else {
                    console.error(`Process ${name} not found in dump`);
                }
            }
        } catch (err) {
            console.error('Failed to fetch process config for editing', err);
        }
    }

    private async _handleDeleteProcess(name: string) {
        if (!confirm(`Are you sure you want to delete process "${name}"? This will stop it and remove it from configuration.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/v1/dump/${encodeURIComponent(name)}`, { method: 'DELETE' });
            const d = await res.json();
            if (d.success) {
                this.notifications.show({ message: `Process "${name}" deleted`, type: 'success' });
                this.fetchData();
            } else {
                this.notifications.show({ message: d.error || 'Delete failed', type: 'error', title: 'Error' });
            }
        } catch (err) {
            this.notifications.show({ message: 'Failed to delete process', type: 'error' });
            console.error('Failed to delete process', err);
        }
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        this.socket = new WebSocket(`${protocol}//${host}/ws`);

        this.socket.onopen = () => {
            console.log('Connected to TSPM Node');
            this.isOnline = true;
            this.fetchData();
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleUpdate(data);
        };

        this.socket.onclose = () => {
            console.log('Disconnected from TSPM Node');
            this.isOnline = false;
            setTimeout(() => this.connect(), 3000);
        };
    }

    handleUpdate(data: WebSocketMessage) {
        switch (data.type) {
            case 'process:update':
                this.processes = Array.isArray((data.payload as ProcessUpdatePayload)?.processes)
                    ? (data.payload as ProcessUpdatePayload).processes
                    : [];
                break;
            case 'process:log':
                this.dispatchEvent(new CustomEvent('new-log', { detail: data.payload, bubbles: true, composed: true }));
                break;
            case 'terminal:out':
                // Send to active terminal or specific terminal if payload has ID
                break;
            case 'system:stats':
                this.systemStats = data.payload as SystemStats;
                break;
        }
    }

    async fetchData() {
        try {
            const res = await fetch('/api/v1/status');
            const data = await res.json();
            if (data.success) {
                this.processes = Array.isArray(data.data?.processes) ? data.data.processes : [];
            }
        } catch (err) {
            console.error('Failed to fetch data', err);
        }
    }

    static override styles = css`
        :host {
            display: grid;
            grid-template-columns: auto 1fr;
            height: 100vh;
            background: #0a0a0c;
            color: #e2e8f0;
            font-family: 'Outfit', sans-serif;
            overflow: hidden;
        }

        @media (max-width: 768px) {
            :host {
                grid-template-columns: 1fr;
            }
            .view-container {
                padding: 1rem;
            }
        }

        .backdrop {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(4px);
            z-index: 90;
            animation: fadeIn 0.3s ease;
        }

        .backdrop.active {
            display: block;
        }

        .main-content {
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: radial-gradient(circle at top right, #1a1a2e 0%, #0a0a0c 100%);
        }

        .view-container {
            flex: 1;
            padding: 2rem;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #334155 transparent;
            position: relative;
        }

        .view-container::-webkit-scrollbar {
            width: 6px;
        }

        .view-container::-webkit-scrollbar-thumb {
            background-color: #334155;
            border-radius: 10px;
        }

        .view {
            display: none;
            height: 100%;
            animation: fadeIn 0.4s ease-out;
        }

        .view.active {
            display: block;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Terminal Tabs Styles */
        .terminal-tabs {
            display: flex;
            gap: 4px;
            margin-bottom: 12px;
            padding: 4px;
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
            width: fit-content;
        }

        .terminal-tab {
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.75rem;
            cursor: pointer;
            color: #888;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
            background: transparent;
            border: 1px solid transparent;
        }

        .terminal-tab:hover {
            color: #fff;
            background: rgba(255,255,255,0.05);
        }

        .terminal-tab.active {
            color: #fff;
            background: rgba(99, 102, 241, 0.2);
            border-color: rgba(99, 102, 241, 0.4);
        }

        .add-tab {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            background: rgba(255,255,255,0.05);
            color: #888;
            cursor: pointer;
            transition: all 0.2s;
        }

        .add-tab:hover {
            background: rgba(99, 102, 241, 0.3);
            color: #fff;
        }
    `;

    override render() {
        return html`
            <tspm-sidebar 
                .currentView="${this.currentView}" 
                .isOnline="${this.isOnline}"
                ?collapsed="${this.sidebarCollapsed}"
                ?active="${this.sidebarActive}"
            ></tspm-sidebar>

            <div class="backdrop ${this.sidebarActive ? 'active' : ''}" @click="${() => this.sidebarActive = false}"></div>
            
            <main class="main-content">
                <tspm-topbar 
                    @refresh="${this.fetchData}"
                    @open-modal="${() => this.modal.open()}"
                ></tspm-topbar>
                
                <div class="view-container">
                    <tspm-dashboard 
                        class="view ${this.currentView === 'dashboard' ? 'active' : ''}"
                        .processes="${this.processes}"
                        .stats="${this.systemStats}"
                    ></tspm-dashboard>

                    <tspm-process-table
                        class="view ${this.currentView === 'processes' ? 'active' : ''}"
                        .processes="${this.processes}"
                    ></tspm-process-table>

                    <div class="view ${this.currentView === 'terminal' ? 'active' : ''}">
                        <div class="terminal-tabs">
                            ${this.terminals.map(t => html`
                                <div 
                                    class="terminal-tab ${this.activeTerminalId === t.id ? 'active' : ''}"
                                    @click="${() => this._navigateTo(`terminal/${t.id}`)}"
                                >
                                    <span>${t.title}</span>
                                    <svg @click="${(e: Event) => { e.stopPropagation(); this._closeTerminal(t.id); }}" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </div>
                            `)}
                            <div class="add-tab" @click="${this._addTerminal}" title="New Terminal">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </div>
                        </div>
                        
                        ${this.terminals.map(t => html`
                            <tspm-terminal
                                style="display: ${this.activeTerminalId === t.id ? 'block' : 'none'}"
                                .terminalId="${t.id}"
                                .active="${this.activeTerminalId === t.id && this.currentView === 'terminal'}"
                                .history="${t.history}"
                                .currentCwd="${t.cwd}"
                            ></tspm-terminal>
                        `)}
                    </div>

                    <tspm-logs
                        class="view ${this.currentView === 'logs' ? 'active' : ''}"
                        .processes="${this.processes}"
                    ></tspm-logs>

                    <tspm-profiles
                        class="view ${this.currentView === 'profiles' ? 'active' : ''}"
                    ></tspm-profiles>
                </div>
            </main>

            <tspm-modal 
                @process-added="${this.fetchData}"
                @process-updated="${this.fetchData}"
            ></tspm-modal>

            <tspm-notification></tspm-notification>
        `;
    }
}

