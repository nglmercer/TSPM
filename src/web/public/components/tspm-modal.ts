import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('tspm-modal')
export class TspmModal extends LitElement {
    @property({ type: Boolean }) isOpen = false;

    open() { this.isOpen = true; }
    close() { this.isOpen = false; }

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
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        .overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        .modal {
            background: #1a1a1e;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            width: 500px;
            max-width: 90%;
            padding: 2rem;
            transform: scale(0.9);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .active .modal {
            transform: scale(1);
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }

        header h2 { margin: 0; font-size: 1.5rem; color: #fff; }

        .btn-close {
            background: none;
            border: none;
            color: #64748b;
            font-size: 1.5rem;
            cursor: pointer;
        }

        form { display: flex; flex-direction: column; gap: 1.5rem; }

        .form-group { display: flex; flex-direction: column; gap: 8px; }
        label { color: #94a3b8; font-size: 0.9rem; font-weight: 500; }

        input, select {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 0.75rem 1rem;
            color: #fff;
            font-family: inherit;
        }

        input:focus { border-color: #6366f1; outline: none; }

        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        footer {
            margin-top: 2.5rem;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }

        .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
        }

        .btn-cancel { background: transparent; color: #94a3b8; }
        .btn-primary { background: #6366f1; color: white; }
        .btn-primary:hover { background: #4f46e5; }
    `;

    private async _handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const config = Object.fromEntries(formData.entries());

        try {
            const res = await fetch(`/api/v1/processes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            const data = await res.json();
            if (data.success) {
                this.close();
                this.dispatchEvent(new CustomEvent('process-added', { bubbles: true, composed: true }));
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Failed to spawn process');
        }
    }

    override render() {
        return html`
            <div class="overlay ${this.isOpen ? 'active' : ''}" @click="${(e: any) => e.target.classList.contains('overlay') && this.close()}">
                <div class="modal">
                    <header>
                        <h2>Process Configuration</h2>
                        <button class="btn-close" @click="${this.close}">&times;</button>
                    </header>
                    <form @submit="${this._handleSubmit}">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" name="name" placeholder="my-awesome-api" required />
                        </div>
                        <div class="row">
                            <div class="form-group">
                                <label>Script Path</label>
                                <input type="text" name="script" placeholder="./src/index.ts" required />
                            </div>
                            <div class="form-group">
                                <label>Interpreter</label>
                                <select name="interpreter">
                                    <option value="bun">Bun</option>
                                    <option value="node">Node</option>
                                </select>
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group">
                                <label>Instances</label>
                                <input type="number" name="instances" value="1" min="1" />
                            </div>
                            <div class="form-group">
                                <label>Namespace</label>
                                <input type="text" name="namespace" placeholder="production" />
                            </div>
                        </div>
                        <footer>
                            <button type="button" class="btn btn-cancel" @click="${this.close}">Cancel</button>
                            <button type="submit" class="btn btn-primary">Spawn Instance</button>
                        </footer>
                    </form>
                </div>
            </div>
        `;
    }
}

