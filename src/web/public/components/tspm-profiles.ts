import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import type { DumpProcess, Profile, ToastMessage } from '../types';
import './tspm-modal';

@customElement('tspm-profiles')
export class TspmProfiles extends LitElement {
    @state() private currentDump: DumpProcess[] = [];
    @state() private profiles: Profile[] = [];
    @state() private loading = false;
    @state() private toast: ToastMessage | null = null;
    @state() private newProfileName = '';
    @state() private showNewForm = false;
    @state() private editingProcess: DumpProcess | null = null;
    @state() private showEditModal = false;


    override connectedCallback() {
        super.connectedCallback();
        this._loadProfiles();
        this._fetchDump();
    }

    // ─── LocalStorage helpers ──────────────────────────────────────────────────
    private _loadProfiles() {
        try {
            this.profiles = JSON.parse(localStorage.getItem('tspm-profiles') || '[]');
        } catch { this.profiles = []; }
    }

    private _saveProfiles() {
        localStorage.setItem('tspm-profiles', JSON.stringify(this.profiles));
    }

    // ─── API helpers ───────────────────────────────────────────────────────────
    private async _fetchDump() {
        this.loading = true;
        try {
            const res = await fetch('/api/v1/dump');
            const d = await res.json();
            if (d.success) this.currentDump = d.data?.processes ?? [];
        } catch { this._showToast('Failed to load dump.json', false); }
        finally { this.loading = false; }
    }

    private async _pushDump(processes: DumpProcess[]) {
        this.loading = true;
        try {
            const res = await fetch('/api/v1/dump', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ processes })
            });
            const d = await res.json();
            if (d.success) {
                this.currentDump = processes;
                this._showToast('dump.json updated ✓', true);
                this.dispatchEvent(new CustomEvent('refresh-required', { bubbles: true, composed: true }));
            } else {
                this._showToast(d.error || 'Update failed', false);
            }
        } catch { this._showToast('Network error', false); }
        finally { this.loading = false; }
    }

    private async _deleteFromDump(name: string) {
        this.loading = true;
        try {
            const res = await fetch(`/api/v1/dump/${encodeURIComponent(name)}`, { method: 'DELETE' });
            const d = await res.json();
            if (d.success) {
                this.currentDump = this.currentDump.filter(p => p.name !== name);
                this._showToast(`Removed "${name}"`, true);
                this.dispatchEvent(new CustomEvent('refresh-required', { bubbles: true, composed: true }));
            } else {
                this._showToast(d.error || 'Delete failed', false);
            }
        } catch { this._showToast('Network error', false); }
        finally { this.loading = false; }
    }

    public async _patchInDump(name: string, patch: Partial<DumpProcess>) {
        this.loading = true;
        try {
            const res = await fetch(`/api/v1/dump/${encodeURIComponent(name)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch)
            });
            const d = await res.json();
            if (d.success) {
                this.currentDump = this.currentDump.map(p => p.name === name ? { ...p, ...patch, name } : p);
                this._showToast(`Updated "${name}"`, true);
                this.editingProcess = null;
            } else {
                this._showToast(d.error || 'Patch failed', false);
            }
        } catch { this._showToast('Network error', false); }
        finally { this.loading = false; }
    }

    // ─── Profile actions ──────────────────────────────────────────────────────
    private _saveProfile() {
        const label = this.newProfileName.trim();
        if (!label) return;
        const profile: Profile = {
            id: `p-${Date.now()}`,
            label,
            processes: JSON.parse(JSON.stringify(this.currentDump)),
            savedAt: new Date().toISOString()
        };
        this.profiles = [...this.profiles, profile];
        this._saveProfiles();
        this.newProfileName = '';
        this.showNewForm = false;
        this._showToast(`Profile "${label}" saved`, true);
    }

    private _loadProfile(p: Profile) {
        this._pushDump(p.processes);
    }

    private _deleteProfile(id: string) {
        this.profiles = this.profiles.filter(p => p.id !== id);
        this._saveProfiles();
        this._showToast('Profile deleted', true);
    }

    // ─── Edit process ─────────────────────────────────────────────────────────
    private _startEdit(proc: DumpProcess) {
        this.editingProcess = proc;
        this.showEditModal = true;
    }

    public _closeEditModal() {
        this.showEditModal = false;
        this.editingProcess = null;
    }

    private _handleProcessUpdated() {
        this._showToast(`Updated "${this.editingProcess?.name}"`, true);
        this._fetchDump();
        this.dispatchEvent(new CustomEvent('refresh-required', { bubbles: true, composed: true }));
    }

    // ─── Toast ────────────────────────────────────────────────────────────────
    private _showToast(msg: string, ok: boolean) {
        this.toast = { msg, ok };
        setTimeout(() => { this.toast = null; }, 3000);
    }

    private _shortName(name: string): string {
        return name.replace(/\\/g, '/').split('/').pop() || name;
    }

    static override styles = css`
        :host { display: block; }

        h2 { margin: 0 0 1.5rem; font-size: 1.4rem; font-weight: 700; color: #fff; }
        h3 { margin: 0 0 1rem; font-size: 1rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.78rem; }

        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start; }
        @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }

        /* Cards */
        .card {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 16px;
            overflow: hidden;
        }
        .card-header {
            padding: 1rem 1.25rem;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        /* Process rows */
        .proc-row {
            padding: 0.7rem 1.25rem;
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 1px solid rgba(255,255,255,0.03);
            transition: background 0.15s;
        }
        .proc-row:last-child { border-bottom: none; }
        .proc-row:hover { background: rgba(255,255,255,0.03); }
        .proc-name { flex: 1; font-size: 0.88rem; color: #e2e8f0; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .proc-script { font-size: 0.75rem; color: #475569; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px; }

        /* Profile rows */
        .profile-row {
            padding: 0.85rem 1.25rem;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.03);
            transition: background 0.15s;
        }
        .profile-row:last-child { border-bottom: none; }
        .profile-row:hover { background: rgba(255,255,255,0.03); }
        .profile-label { flex: 1; font-size: 0.9rem; font-weight: 600; color: #e2e8f0; }
        .profile-meta { font-size: 0.75rem; color: #475569; }

        /* Buttons */
        .btn {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 0.45rem 0.9rem; border-radius: 8px;
            font-size: 0.82rem; font-weight: 500; cursor: pointer;
            transition: all 0.15s; border: 1px solid transparent; font-family: inherit;
        }
        .btn-primary  { background: #6366f1; color: #fff; }
        .btn-primary:hover  { background: #4f46e5; }
        .btn-success  { background: rgba(16,185,129,0.12); color: #10b981; border-color: rgba(16,185,129,0.2); }
        .btn-success:hover  { background: rgba(16,185,129,0.2); }
        .btn-danger   { background: rgba(239,68,68,0.1); color: #f87171; border-color: rgba(239,68,68,0.15); }
        .btn-danger:hover   { background: rgba(239,68,68,0.2); }
        .btn-ghost    { background: rgba(255,255,255,0.04); color: #94a3b8; border-color: rgba(255,255,255,0.07); }
        .btn-ghost:hover    { color: #fff; background: rgba(255,255,255,0.08); }
        .btn-sm { padding: 0.3rem 0.65rem; font-size: 0.78rem; }

        /* New profile input */
        .input-row { display: flex; gap: 8px; padding: 1rem 1.25rem; border-top: 1px solid rgba(255,255,255,0.05); }
        input[type="text"] {
            flex: 1; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08);
            color: #fff; padding: 0.45rem 0.8rem; border-radius: 8px; font-family: inherit; font-size: 0.88rem;
        }
        input[type="text"]:focus { outline: none; border-color: rgba(99,102,241,0.4); }

        /* Edit modal - now using tspm-modal */

        /* Toast */
        .toast {
            position: fixed; bottom: 2rem; right: 2rem; z-index: 99999;
            padding: 0.75rem 1.25rem; border-radius: 12px; font-size: 0.9rem;
            font-weight: 500; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            animation: slideIn 0.3s ease;
        }
        .toast.ok  { background: #064e3b; color: #34d399; border: 1px solid rgba(52,211,153,0.2); }
        .toast.err { background: #450a0a; color: #f87171; border: 1px solid rgba(248,113,113,0.2); }
        @keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

        .empty { padding: 2rem; text-align: center; color: #475569; font-size: 0.88rem; }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
    `;

    override render() {
        return html`
            ${this.toast ? html`
                <div class="toast ${this.toast.ok ? 'ok' : 'err'}">${this.toast.msg}</div>` : ''}

            <tspm-modal
                .isOpen="${this.showEditModal}"
                .editMode="${true}"
                .processName="${this.editingProcess?.name || ''}"
                .editProcess="${this.editingProcess}"
                @process-added="${this._fetchDump}"
                @process-updated="${this._handleProcessUpdated}"
                @modal-close="${this._closeEditModal}"
            ></tspm-modal>

            <h2>Process Profiles</h2>

            <div class="grid">
                <!-- ── Current dump.json ── -->
                <div>
                    <h3>Current dump.json</h3>
                    <div class="card">
                        <div class="card-header">
                            <span style="color:#e2e8f0;font-size:0.9rem;font-weight:600">
                                ${this.currentDump.length} process(es)
                            </span>
                            <button class="btn btn-ghost btn-sm" @click="${this._fetchDump}" title="Reload">
                                <svg style="width:13px;height:13px;${this.loading ? 'animation:spin 1s linear infinite' : ''}"
                                     viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                                    <path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                                    <path d="M8 16H3v5"/>
                                </svg>
                                Reload
                            </button>
                        </div>

                        ${this.currentDump.length === 0
                            ? html`<div class="empty">No processes in dump.json</div>`
                            : this.currentDump.map(p => html`
                                <div class="proc-row">
                                    <div style="flex:1;overflow:hidden">
                                        <div class="proc-name" title="${p.name}">${this._shortName(p.name)}</div>
                                        <div class="proc-script" title="${p.script}">${p.script}</div>
                                    </div>
                                    <button class="btn btn-ghost btn-sm" @click="${() => this._startEdit(p)}" title="Edit">
                                        <svg style="width:12px;height:12px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                    </button>
                                    <button class="btn btn-danger btn-sm" @click="${() => this._deleteFromDump(p.name)}" title="Remove">
                                        <svg style="width:12px;height:12px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                                            <path d="M10 11v6"/><path d="M14 11v6"/>
                                            <path d="M9 6V4h6v2"/>
                                        </svg>
                                    </button>
                                </div>
                            `)
                        }
                    </div>
                </div>

                <!-- ── Saved profiles ── -->
                <div>
                    <h3>Saved profiles</h3>
                    <div class="card">
                        ${this.profiles.length === 0
                            ? html`<div class="empty">No profiles saved yet.<br>Save the current dump as a profile!</div>`
                            : this.profiles.map(p => html`
                                <div class="profile-row">
                                    <div style="flex:1;overflow:hidden">
                                        <div class="profile-label">${p.label}</div>
                                        <div class="profile-meta">
                                            ${p.processes.length} process(es) ·
                                            ${new Date(p.savedAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <button class="btn btn-success btn-sm" @click="${() => this._loadProfile(p)}" title="Apply profile">Load</button>
                                    <button class="btn btn-danger btn-sm" @click="${() => this._deleteProfile(p.id)}" title="Delete profile">
                                        <svg style="width:12px;height:12px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                                            <path d="M10 11v6"/><path d="M14 11v6"/>
                                            <path d="M9 6V4h6v2"/>
                                        </svg>
                                    </button>
                                </div>
                            `)
                        }

                        <!-- Save current dump as profile -->
                        ${this.showNewForm ? html`
                            <div class="input-row">
                                <input type="text" placeholder="Profile name…"
                                    .value="${this.newProfileName}"
                                    @input="${(e: Event) => this.newProfileName = (e.target as HTMLInputElement).value}"
                                    @keydown="${(e: KeyboardEvent) => e.key === 'Enter' && this._saveProfile()}"
                                    autofocus
                                />
                                <button class="btn btn-primary btn-sm" @click="${this._saveProfile}">Save</button>
                                <button class="btn btn-ghost btn-sm" @click="${() => { this.showNewForm = false; this.newProfileName = ''; }}">Cancel</button>
                            </div>
                        ` : html`
                            <div style="padding:0.75rem 1.25rem;border-top:1px solid rgba(255,255,255,0.05)">
                                <button class="btn btn-primary" style="width:100%" @click="${() => { this.showNewForm = true; }}">
                                    <svg style="width:14px;height:14px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                    </svg>
                                    Save current dump as profile
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
}
