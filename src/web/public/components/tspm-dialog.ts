import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Reusable dialog/modal component for TSPM
 * Can be customized with dialogTitle, size, and custom content via slots
 */
@customElement('tspm-dialog')
export class TspmDialog extends LitElement {
    @property({ type: Boolean }) open = false;
    @property({ type: String }) dialogTitle = '';
    @property({ type: String }) width = '500px';

    /**
     * Close the dialog
     */
    close() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('dialog-close', { bubbles: true, composed: true }));
    }

    static override styles = css`
        :host {
            display: contents;
        }

        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        .overlay.open {
            opacity: 1;
            pointer-events: auto;
        }

        .dialog {
            background: #1a1a1e;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            width: var(--dialog-width, 500px);
            max-width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            padding: 2rem;
            transform: scale(0.9);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .overlay.open .dialog {
            transform: scale(1);
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        header h2 {
            margin: 0;
            font-size: 1.5rem;
            color: #fff;
            font-weight: 600;
        }

        .btn-close {
            background: none;
            border: none;
            color: #64748b;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            line-height: 1;
            transition: color 0.2s;
        }

        .btn-close:hover {
            color: #fff;
        }

        .content {
            color: #e2e8f0;
        }

        /* Slot container for custom content */
        ::slotted(*) {
            display: block;
        }
    `;

    override render() {
        return html`
            <div 
                class="overlay ${this.open ? 'open' : ''}" 
                style="--dialog-width: ${this.width}"
                @click="${(e: MouseEvent) => e.target === e.currentTarget && this.close()}"
            >
                <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
                    <header>
                        <h2 id="dialog-title">${this.dialogTitle}</h2>
                        <button class="btn-close" @click="${this.close}" aria-label="Close">&times;</button>
                    </header>
                    <div class="content">
                        <slot></slot>
                    </div>
                </div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'tspm-dialog': TspmDialog;
    }
}
