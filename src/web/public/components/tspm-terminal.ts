import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import type { TerminalEntry } from '../types';

@customElement('tspm-terminal')
export class TspmTerminal extends LitElement {
    @property({ type: String }) terminalId = 'default';
    @property({ type: Boolean }) active = false;
    @property({ type: Array }) history: TerminalEntry[] = [];
    @property({ type: String }) currentCwd = '';

    @state() private suggestions: string[] = [];
    @state() private suggestionIndex = -1;

    @query('.output') private outputEl?: HTMLElement;
    @query('input') private inputEl?: HTMLInputElement;

    constructor() {
        super();
        this._setupListeners();
        if (!this.currentCwd) this._initCwd();
    }

    private async _initCwd() {
        try {
            const res = await fetch('/api/v1/stats');
            const data = await res.json();
            if (data.success && data.data.cwd) {
                this.currentCwd = data.data.cwd;
                this._notifyChange();
            } else {
                this.currentCwd = '/';
            }
        } catch (e) {
            this.currentCwd = '/';
        }
    }

    private _setupListeners() {
        window.addEventListener('terminal:out', ((e: CustomEvent<{ terminalId?: string, text: string }>) => {
            const targetId = e.detail.terminalId || 'default';
            if (targetId === this.terminalId) {
                this.history = [...this.history, { text: e.detail.text, type: 'output' }];
                this._notifyChange();
                this._scrollToBottom();
            }
        }) as EventListener);
    }

    private _notifyChange() {
        this.dispatchEvent(new CustomEvent('terminal-change', {
            detail: {
                id: this.terminalId,
                history: this.history,
                cwd: this.currentCwd
            },
            bubbles: true,
            composed: true
        }));
    }

    static override styles = css`
        :host {
            display: block;
            height: 100%;
            animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .terminal {
            background: #000;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            height: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            backdrop-filter: blur(10px);
        }

        .header {
            background: rgba(26, 26, 26, 0.8);
            padding: 8px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .left-header { display: flex; align-items: center; gap: 12px; }
        .dots { display: flex; gap: 6px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; cursor: pointer; transition: transform 0.2s; }
        .dot:hover { transform: scale(1.2); }
        .dot.red { background: #ff5f56; }
        .dot.yellow { background: #ffbd2e; }
        .dot.green { background: #27c93f; }

        .title { 
            color: #888; 
            font-size: 0.7rem; 
            text-transform: uppercase;
            letter-spacing: 1px;
            font-family: 'JetBrains Mono', monospace; 
        }

        .actions {
            display: flex;
            gap: 8px;
        }

        .close-btn {
            background: transparent;
            border: none;
            color: #666;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .close-btn:hover {
            background: rgba(255, 95, 86, 0.2);
            color: #ff5f56;
        }

        .output {
            flex: 1;
            padding: 1rem;
            overflow-y: auto;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.85rem;
            color: #d1d5db;
            line-height: 1.6;
            white-space: pre-wrap;
            scrollbar-width: thin;
            scroll-behavior: smooth;
        }

        .output::-webkit-scrollbar { width: 6px; }
        .output::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }

        .line { margin-bottom: 4px; border-left: 2px solid transparent; padding-left: 8px; }
        .line.input { color: #818cf8; font-weight: bold; border-left-color: #6366f1; }
        .line.error { color: #f87171; border-left-color: #ef4444; }
        .line.output { color: #9ca3af; }

        .input-area {
            display: flex;
            align-items: center;
            padding: 1rem;
            background: #000;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            position: relative;
        }

        .prompt { 
            color: #10b981; 
            margin-right: 12px; 
            font-weight: bold; 
            font-family: 'JetBrains Mono', monospace;
            white-space: nowrap;
        }
        .prompt .path { color: #6366f1; margin-right: 4px; font-weight: normal; opacity: 0.8; }

        input {
            background: transparent;
            border: none;
            color: #fff;
            outline: none;
            flex: 1;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.9rem;
            caret-color: #6366f1;
        }

        .suggestions {
            position: absolute;
            bottom: 100%;
            left: 0;
            right: 0;
            background: #1a1a1a;
            border-top: 1px solid #333;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            padding: 8px 16px;
            font-size: 0.75rem;
            font-family: 'JetBrains Mono', monospace;
            max-height: 100px;
            overflow-y: auto;
        }

        .suggestion {
            padding: 2px 8px;
            background: #333;
            border-radius: 4px;
            color: #888;
        }

        .suggestion.selected {
            background: #6366f1;
            color: #fff;
        }
    `;

    private async _handleKey(e: KeyboardEvent) {
        if (e.key === 'Tab') {
            e.preventDefault();
            await this._handleAutocomplete();
            return;
        }

        if (this.suggestions.length > 0) {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                this.suggestionIndex = (this.suggestionIndex + (e.key === 'ArrowRight' ? 1 : -1) + this.suggestions.length) % this.suggestions.length;
                return;
            }
            if (e.key === 'Escape') {
                this.suggestions = [];
                this.suggestionIndex = -1;
                return;
            }
        }

        if (e.key === 'Enter') {
            if (this.suggestionIndex >= 0) {
                this._applySuggestion(this.suggestions[this.suggestionIndex]!);
                return;
            }

            const cmd = (e.target as HTMLInputElement).value.trim();
            if (!cmd) return;

            if (cmd === 'clear') {
                this.history = [];
                (e.target as HTMLInputElement).value = '';
                this._notifyChange();
                return;
            }

            this.history = [...this.history, { text: cmd, type: 'input' }];
            (e.target as HTMLInputElement).value = '';
            this._notifyChange();

            try {
                const res = await fetch('/api/v1/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        command: cmd,
                        cwd: this.currentCwd
                    })
                });
                const data = await res.json();
                
                if (data.success) {
                    if (data.newCwd) {
                        this.currentCwd = data.newCwd;
                    }
                    if (data.output) {
                        this.history = [...this.history, { text: data.output, type: 'output' }];
                    }
                } else {
                    if (data.error) {
                        this.history = [...this.history, { text: data.error, type: 'error' }];
                    }
                }
                
                this._notifyChange();
                this._scrollToBottom();
            } catch (err) {
                this.history = [...this.history, { text: 'Execution failed', type: 'error' }];
                this._notifyChange();
            }
        }
    }

    private async _handleAutocomplete() {
        if (!this.inputEl) return;
        const value = this.inputEl.value;
        const lastSpace = value.lastIndexOf(' ');
        const prefix = lastSpace === -1 ? value : value.substring(lastSpace + 1);

        try {
            const res = await fetch('/api/v1/autocomplete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prefix, cwd: this.currentCwd })
            });
            const data = await res.json();
            if (data.success && data.suggestions.length > 0) {
                if (data.suggestions.length === 1) {
                    this._applySuggestion(data.suggestions[0]);
                } else {
                    this.suggestions = data.suggestions;
                    this.suggestionIndex = 0;
                }
            }
        } catch (e) {
            console.warn('Autocomplete failed', e);
        }
    }

    private _applySuggestion(suggestion: string) {
        if (!this.inputEl) return;
        const value = this.inputEl.value;
        const lastSpace = value.lastIndexOf(' ');
        const newValue = (lastSpace === -1 ? '' : value.substring(0, lastSpace + 1)) + suggestion;
        this.inputEl.value = newValue;
        this.suggestions = [];
        this.suggestionIndex = -1;
    }

    private _scrollToBottom() {
        setTimeout(() => {
            if (this.outputEl) this.outputEl.scrollTop = this.outputEl.scrollHeight;
        }, 0);
    }

    override updated(changed: PropertyValues) {
        if (changed.has('active') && this.active) {
            setTimeout(() => this.inputEl?.focus(), 100);
        }
        if (changed.has('history')) {
            this._scrollToBottom();
        }
    }

    private _getShortCwd() {
        if (!this.currentCwd) return '~';
        const parts = this.currentCwd.split(/[\\/]/);
        const last = parts[parts.length - 1] || parts[parts.length - 2] || '/';
        return last;
    }

    private _onClose() {
        this.dispatchEvent(new CustomEvent('close-terminal', {
            detail: { id: this.terminalId },
            bubbles: true,
            composed: true
        }));
    }

    override render() {
        return html`
            <div class="terminal">
                <div class="header">
                    <div class="left-header">
                        <div class="dots">
                            <div class="dot red" @click="${this._onClose}"></div>
                            <div class="dot yellow"></div>
                            <div class="dot green"></div>
                        </div>
                        <div class="title">TSPM SHELL — ${this.terminalId}</div>
                    </div>
                    <div class="actions">
                        <button class="close-btn" @click="${this._onClose}" title="Close Tab (Ctrl+W)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
                <div class="output">
                    ${this.history.map(line => html`
                        <div class="line ${line.type}">${line.type === 'input' ? '$ ' : ''}${line.text}</div>
                    `)}
                </div>
                <div class="input-area">
                    ${this.suggestions.length > 0 ? html`
                        <div class="suggestions">
                            ${this.suggestions.map((s, i) => html`
                                <div class="suggestion ${i === this.suggestionIndex ? 'selected' : ''}">${s}</div>
                            `)}
                        </div>
                    ` : ''}
                    <span class="prompt">
                        <span class="path">${this._getShortCwd()}</span>➜
                    </span>
                    <input 
                        type="text" 
                        placeholder="Type a command..." 
                        @keydown="${this._handleKey}"
                        spellcheck="false"
                        autocomplete="off"
                    />
                </div>
            </div>
        `;
    }
}
