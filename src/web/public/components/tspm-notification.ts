import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface ToastOptions {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    title?: string;
}

@customElement('tspm-notification')
export class TspmNotification extends LitElement {
    @state() private notifications: (ToastOptions & { id: number })[] = [];
    private _nextId = 0;

    /**
     * Show a new notification
     */
    show(options: ToastOptions) {
        const id = this._nextId++;
        const notification = { ...options, id };
        this.notifications = [...this.notifications, notification];

        if (options.duration !== 0) {
            setTimeout(() => {
                this.notifications = this.notifications.filter(n => n.id !== id);
            }, options.duration || 5000);
        }
    }

    private _remove(id: number) {
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    static override styles = css`
        :host {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            pointer-events: none;
        }

        .toast {
            pointer-events: auto;
            min-width: 300px;
            max-width: 450px;
            background: #1a1a1e;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 1rem;
            display: flex;
            gap: 12px;
            box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
            animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            position: relative;
            overflow: hidden;
        }

        .toast::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
        }

        .toast.success::before { background: #10b981; }
        .toast.error::before { background: #ef4444; }
        .toast.info::before { background: #6366f1; }
        .toast.warning::before { background: #f59e0b; }

        .toast.success i { color: #10b981; }
        .toast.error i { color: #ef4444; }
        .toast.info i { color: #6366f1; }
        .toast.warning i { color: #f59e0b; }

        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        .icon-container {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: 2px;
        }

        .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .title {
            font-weight: 600;
            color: #fff;
            font-size: 0.95rem;
        }

        .message {
            color: #94a3b8;
            font-size: 0.88rem;
            line-height: 1.4;
        }

        .close {
            background: none;
            border: none;
            color: #475569;
            cursor: pointer;
            padding: 4px;
            font-size: 1.2rem;
            line-height: 1;
            align-self: flex-start;
            transition: color 0.2s;
        }

        .close:hover {
            color: #fff;
        }
    `;

    private _getIcon(type: string) {
        switch (type) {
            case 'success': return html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
            case 'error': return html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
            case 'warning': return html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
            default: return html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        }
    }

    override render() {
        return html`
            ${this.notifications.map(n => html`
                <div class="toast ${n.type}">
                    <div class="icon-container">
                        <i>${this._getIcon(n.type)}</i>
                    </div>
                    <div class="content">
                        ${n.title ? html`<div class="title">${n.title}</div>` : ''}
                        <div class="message">${n.message}</div>
                    </div>
                    <button class="close" @click="${() => this._remove(n.id)}">&times;</button>
                </div>
            `)}
        `;
    }
}
