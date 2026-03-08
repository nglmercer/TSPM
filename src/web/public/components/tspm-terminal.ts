import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';

@customElement('tspm-terminal')
export class TspmTerminal extends LitElement {
    @property({ type: Boolean }) active = false;
    @state() private history: any[] = [];

    @query('.output') private outputEl?: HTMLElement;
    @query('input') private inputEl?: HTMLInputElement;

    constructor() {
        super();
        this._setupListeners();
    }

    private _setupListeners() {
        window.addEventListener('terminal-out', (e: any) => {
            this.history = [...this.history, { text: e.detail, type: 'output' }];
            this._scrollToBottom();
        });
    }

    static override styles = css`
        :host {
            display: block;
            height: 100%;
        }

        .terminal {
            background: #000;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            height: 600px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .header {
            background: #1a1a1a;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid #333;
        }

        .dots { display: flex; gap: 6px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.red { background: #ff5f56; }
        .dot.yellow { background: #ffbd2e; }
        .dot.green { background: #27c93f; }

        .title { color: #888; font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; }

        .output {
            flex: 1;
            padding: 1rem;
            overflow-y: auto;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.9rem;
            color: #d1d5db;
            line-height: 1.5;
            white-space: pre-wrap;
            scrollbar-width: thin;
        }

        .output::-webkit-scrollbar { width: 6px; }
        .output::-webkit-scrollbar-thumb { background: #333; }

        .line { margin-bottom: 4px; }
        .line.input { color: #818cf8; font-weight: bold; }
        .line.error { color: #f87171; }

        .input-area {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            background: #000;
            border-top: 1px solid #1a1a1a;
        }

        .prompt { color: #10b981; margin-right: 12px; font-weight: bold; }

        input {
            background: transparent;
            border: none;
            color: #fff;
            outline: none;
            flex: 1;
            font-family: inherit;
            font-size: inherit;
        }
    `;

    private async _handleKey(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            const cmd = (e.target as HTMLInputElement).value.trim();
            if (!cmd) return;

            this.history = [...this.history, { text: cmd, type: 'input' }];
            (e.target as HTMLInputElement).value = '';

            try {
                const res = await fetch('/api/v1/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command: cmd })
                });
                const data = await res.json();
                if (data.output) this.history = [...this.history, { text: data.output, type: 'output' }];
                if (data.error) this.history = [...this.history, { text: data.error, type: 'error' }];
                this._scrollToBottom();
            } catch (err) {
                this.history = [...this.history, { text: 'Execution failed', type: 'error' }];
            }
        }
    }

    private _scrollToBottom() {
        setTimeout(() => {
            if (this.outputEl) this.outputEl.scrollTop = this.outputEl.scrollHeight;
        }, 0);
    }

    override updated(changed: PropertyValues) {
        if (changed.has('active') && this.active) {
            this.inputEl?.focus();
        }
    }

    override render() {
        return html`
            <div class="terminal">
                <div class="header">
                    <div class="dots">
                        <div class="dot red"></div>
                        <div class="dot yellow"></div>
                        <div class="dot green"></div>
                    </div>
                    <div class="title">TSPM SHELL — BUN</div>
                </div>
                <div class="output">
                    ${this.history.map(line => html`
                        <div class="line ${line.type}">${line.type === 'input' ? '$ ' : ''}${line.text}</div>
                    `)}
                </div>
                <div class="input-area">
                    <span class="prompt">➜</span>
                    <input type="text" placeholder="Type a command..." @keydown="${this._handleKey}" />
                </div>
            </div>
        `;
    }
}

