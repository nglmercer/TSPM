import { LitElement, html, css } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import type { ProcessStatus, SystemStats, WebSocketMessage, ProcessUpdatePayload, ViewChangeDetail } from '../types';
// Note: TspmLogs and TspmModal types are used for query selector typing
// They are imported dynamically via lit decorators query
import type { TspmLogs } from './tspm-logs';
import type { TspmModal } from './tspm-modal';

@customElement('tspm-app')
export class TspmApp extends LitElement {
    @state() currentView = 'dashboard';
    @state() processes: ProcessStatus[] = [];
    @state() systemStats: SystemStats = { cpu: 0, memory: 0, uptime: 0 };
    @state() isOnline = false;
    
    private socket?: WebSocket;

    @query('tspm-modal') modal!: TspmModal;

    constructor() {
        super();
        this.connect();

        this.addEventListener('view-logs', ((e: CustomEvent<string>) => {
            this.currentView = 'logs';
            // Wait for update then set the selected process
            this.updateComplete.then(() => {
                const logsComp = this.shadowRoot?.querySelector('tspm-logs') as TspmLogs | null;
                if (logsComp) logsComp.selectedProcess = e.detail;
            });
        }) as EventListener);

        this.addEventListener('refresh-required', () => this.fetchData());
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
                this.dispatchEvent(new CustomEvent('terminal-out', { detail: data.payload, bubbles: true, composed: true }));
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
            grid-template-columns: 260px 1fr;
            height: 100vh;
            background: #0a0a0c;
            color: #e2e8f0;
            font-family: 'Outfit', sans-serif;
            overflow: hidden;
        }

        @media (max-width: 768px) {
            :host {
                grid-template-columns: 80px 1fr;
            }
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
            animation: fadeIn 0.4s ease-out;
        }

        .view.active {
            display: block;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;

    override render() {
        return html`
            <tspm-sidebar 
                .currentView="${this.currentView}" 
                .isOnline="${this.isOnline}"
                @view-change="${(e: CustomEvent<ViewChangeDetail>) => this.currentView = e.detail.view}"
            ></tspm-sidebar>
            
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

                    <tspm-terminal
                        class="view ${this.currentView === 'terminal' ? 'active' : ''}"
                        ?active="${this.currentView === 'terminal'}"
                    ></tspm-terminal>

                    <tspm-logs
                        class="view ${this.currentView === 'logs' ? 'active' : ''}"
                        .processes="${this.processes}"
                    ></tspm-logs>
                </div>
            </main>

            <tspm-modal @process-added="${this.fetchData}"></tspm-modal>
        `;
    }
}

