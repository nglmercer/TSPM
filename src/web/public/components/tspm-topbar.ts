import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('tspm-topbar')
export class TspmTopbar extends LitElement {
    static override styles = css`
        :host {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.25rem 2rem;
            background: rgba(10, 10, 12, 0.4);
            backdrop-filter: blur(8px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            height: 72px;
            box-sizing: border-box;
        }

        .search-container {
            display: flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 0.6rem 1rem;
            width: 400px;
            gap: 12px;
            transition: all 0.2s ease;
        }

        .search-container:focus-within {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(99, 102, 241, 0.3);
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        }

        .search-container i {
            color: #64748b;
            width: 18px;
            height: 18px;
        }

        .search-container input {
            background: transparent;
            border: none;
            color: #fff;
            outline: none;
            width: 100%;
            font-family: inherit;
            font-size: 0.9rem;
        }

        .actions {
            display: flex;
            gap: 0.75rem;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 0.6rem 1rem;
            border-radius: 10px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            border: 1px solid transparent;
            font-family: inherit;
        }

        .btn-primary {
            background: #6366f1;
            color: white;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }

        .btn-primary:hover {
            background: #4f46e5;
            transform: translateY(-1px);
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.05);
            color: #e2e8f0;
            border-color: rgba(255, 255, 255, 0.1);
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.08);
        }

        .btn-icon {
            padding: 0.6rem;
            aspect-ratio: 1;
        }

        @media (max-width: 640px) {
            .search-container {
                display: none;
            }
        }
    `;

    override render() {
        return html`
            <div class="search-container">
                <i data-lucide="search"></i>
                <input type="text" placeholder="Search processes, logs, commands..." />
            </div>

            <div class="actions">
                <button class="btn btn-secondary btn-icon" @click="${() => this.dispatchEvent(new CustomEvent('refresh'))}">
                    <i data-lucide="refresh-cw"></i>
                </button>
                <button class="btn btn-primary" @click="${() => this.dispatchEvent(new CustomEvent('open-modal'))}">
                    <i data-lucide="plus"></i>
                    <span>New Process</span>
                </button>
            </div>
        `;
    }

    override updated() {
        const lucide = (window as any).lucide;
        if (lucide) {
            lucide.createIcons({
                attrs: { 'stroke-width': 2, 'class': 'lucide-icon' },
                root: this.shadowRoot
            });
        }
    }
}

