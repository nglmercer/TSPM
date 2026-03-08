// src/web/public/components/tspm-sidebar.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3.1.2/+esm";

class TspmSidebar extends LitElement {
  static properties = {
    currentView: { type: String },
    isOnline: { type: Boolean }
  };
  static styles = css`
        :host {
            background: rgba(15, 15, 20, 0.8);
            backdrop-filter: blur(12px);
            border-right: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            flex-direction: column;
            padding: 1.5rem 1rem;
            z-index: 100;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 1rem;
            margin-bottom: 2rem;
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
        }

        .logo-text {
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: -0.5px;
            color: #fff;
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
            padding: 0.875rem 1rem;
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
        }

        .sidebar-footer {
            margin-top: auto;
            padding: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .system-status {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.85rem;
            color: #64748b;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #475569;
        }

        .status-dot.online {
            background: #10b981;
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
        }

        @media (max-width: 768px) {
            .logo-text, .nav-btn span, .system-status span {
                display: none;
            }
            .nav-btn {
                justify-content: center;
                padding: 1rem;
            }
            .logo {
                justify-content: center;
                padding: 1rem 0;
            }
        }
    `;
  _changeView(view) {
    this.dispatchEvent(new CustomEvent("view-change", { detail: view }));
  }
  render() {
    return html`
            <div class="logo">
                <div class="logo-icon">T</div>
                <span class="logo-text">TSPM</span>
            </div>

            <div class="nav-links">
                <button class="nav-btn ${this.currentView === "dashboard" ? "active" : ""}" @click="${() => this._changeView("dashboard")}">
                    <i data-lucide="layout-dashboard"></i>
                    <span>Dashboard</span>
                </button>
                <button class="nav-btn ${this.currentView === "processes" ? "active" : ""}" @click="${() => this._changeView("processes")}">
                    <i data-lucide="cpu"></i>
                    <span>Processes</span>
                </button>
                <button class="nav-btn ${this.currentView === "terminal" ? "active" : ""}" @click="${() => this._changeView("terminal")}">
                    <i data-lucide="terminal"></i>
                    <span>Executor</span>
                </button>
                <button class="nav-btn ${this.currentView === "logs" ? "active" : ""}" @click="${() => this._changeView("logs")}">
                    <i data-lucide="file-text"></i>
                    <span>Live Logs</span>
                </button>
            </div>

            <div class="sidebar-footer">
                <div class="system-status">
                    <div class="status-dot ${this.isOnline ? "online" : ""}"></div>
                    <span>System ${this.isOnline ? "Online" : "Offline"}</span>
                </div>
            </div>
        `;
  }
  updated() {
    if (window.lucide) {
      window.lucide.createIcons({
        attrs: {
          "stroke-width": 2,
          class: "lucide-icon"
        },
        nameAttr: "data-lucide",
        root: this.shadowRoot
      });
    }
  }
}
customElements.define("tspm-sidebar", TspmSidebar);

// src/web/public/components/tspm-topbar.ts
import { LitElement as LitElement2, html as html2, css as css2 } from "https://cdn.jsdelivr.net/npm/lit@3.1.2/+esm";

class TspmTopbar extends LitElement2 {
  static styles = css2`
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
  render() {
    return html2`
            <div class="search-container">
                <i data-lucide="search"></i>
                <input type="text" placeholder="Search processes, logs, commands..." />
            </div>

            <div class="actions">
                <button class="btn btn-secondary btn-icon" @click="${() => this.dispatchEvent(new CustomEvent("refresh"))}">
                    <i data-lucide="refresh-cw"></i>
                </button>
                <button class="btn btn-primary" @click="${() => this.dispatchEvent(new CustomEvent("open-modal"))}">
                    <i data-lucide="plus"></i>
                    <span>New Process</span>
                </button>
            </div>
        `;
  }
  updated() {
    if (window.lucide) {
      window.lucide.createIcons({
        attrs: { "stroke-width": 2, class: "lucide-icon" },
        root: this.shadowRoot
      });
    }
  }
}
customElements.define("tspm-topbar", TspmTopbar);

// src/web/public/components/tspm-dashboard.ts
import { LitElement as LitElement3, html as html3, css as css3 } from "https://cdn.jsdelivr.net/npm/lit@3.1.2/+esm";

class TspmDashboard extends LitElement3 {
  static properties = {
    processes: { type: Array },
    stats: { type: Object }
  };
  static styles = css3`
        :host {
            display: block;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2.5rem;
        }

        .stat-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 1.5rem;
            position: relative;
            overflow: hidden;
            transition: transform 0.2s ease, background 0.2s ease;
        }

        .stat-card:hover {
            background: rgba(255, 255, 255, 0.05);
            transform: translateY(-2px);
        }

        .stat-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }

        .stat-header h3 {
            margin: 0;
            font-size: 0.9rem;
            font-weight: 500;
            color: #94a3b8;
        }

        .stat-header i {
            color: #6366f1;
            width: 20px;
            height: 20px;
        }

        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #fff;
            margin-bottom: 0.5rem;
        }

        .stat-footer {
            font-size: 0.85rem;
        }

        .text-success { color: #10b981; }
        .text-muted { color: #64748b; }

        .progress-bar {
            height: 4px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 2px;
            margin-top: 1rem;
            overflow: hidden;
        }

        .progress {
            height: 100%;
            background: linear-gradient(90deg, #6366f1, #a855f7);
            border-radius: 2px;
            transition: width 0.3s ease;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .section-header h2 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
        }

        .process-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1.5rem;
        }

        .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4rem;
            color: #64748b;
            grid-column: 1 / -1;
        }

        .spin {
            animation: spin 2s linear infinite;
            width: 32px;
            height: 32px;
            margin-bottom: 1rem;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
  formatBytes(bytes) {
    if (!bytes)
      return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
  render() {
    const totalCpu = this.processes.reduce((acc, p) => acc + (p.cpu || 0), 0);
    const totalMem = this.processes.reduce((acc, p) => acc + (p.memory || 0), 0);
    return html3`
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Total Processes</h3>
                        <i data-lucide="layers"></i>
                    </div>
                    <div class="stat-value">${this.processes.length}</div>
                    <div class="stat-footer">
                        <span class="text-success">Active & Monitoring</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Active CPU Usage</h3>
                        <i data-lucide="activity"></i>
                    </div>
                    <div class="stat-value">${Math.round(totalCpu)}%</div>
                    <div class="stat-footer">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${Math.min(100, totalCpu)}%"></div>
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <h3>Total Memory</h3>
                        <i data-lucide="database"></i>
                    </div>
                    <div class="stat-value">${this.formatBytes(totalMem)}</div>
                    <div class="stat-footer">
                        <span class="text-muted">Total allocated</span>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <h3>System Health</h3>
                        <i data-lucide="shield-check"></i>
                    </div>
                    <div class="stat-value">Stable</div>
                    <div class="stat-footer">
                        <span class="text-success">All services operational</span>
                    </div>
                </div>
            </div>

            <div class="section-header">
                <h2>Running Processes</h2>
            </div>

            <div class="process-grid">
                ${this.processes.length === 0 ? html3`
                    <div class="loading-state">
                        <i data-lucide="loader-2" class="spin"></i>
                        <p>Waiting for process data...</p>
                    </div>
                ` : this.processes.map((p) => html3`
                    <tspm-process-card .process="${p}"></tspm-process-card>
                `)}
            </div>
        `;
  }
  updated() {
    if (window.lucide) {
      window.lucide.createIcons({
        attrs: { "stroke-width": 2, class: "lucide-icon" },
        root: this.shadowRoot
      });
    }
  }
}
customElements.define("tspm-dashboard", TspmDashboard);

// src/web/public/components/tspm-process-card.ts
import { LitElement as LitElement4, html as html4, css as css4 } from "https://cdn.jsdelivr.net/npm/lit@3.1.2/+esm";

class TspmProcessCard extends LitElement4 {
  static properties = {
    process: { type: Object }
  };
  static styles = css4`
        :host {
            display: block;
        }

        .card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 1.25rem;
            transition: all 0.2s ease;
        }

        .card:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(99, 102, 241, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.25rem;
        }

        .info h4 {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
            color: #fff;
        }

        .pid {
            font-size: 0.75rem;
            color: #64748b;
            font-family: 'JetBrains Mono', monospace;
            margin-top: 4px;
        }

        .status-badge {
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            padding: 4px 10px;
            border-radius: 20px;
            letter-spacing: 0.5px;
        }

        .status-running {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .status-stopped {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1.5rem;
            background: rgba(0, 0, 0, 0.2);
            padding: 0.875rem;
            border-radius: 12px;
        }

        .stat-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.85rem;
            color: #94a3b8;
        }

        .stat-item i {
            width: 14px;
            height: 14px;
            color: #6366f1;
        }

        .stat-item span {
            color: #e2e8f0;
            font-weight: 500;
        }

        .actions {
            display: flex;
            gap: 8px;
        }

        .btn-icon {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.6rem;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            color: #94a3b8;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-icon:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #fff;
            border-color: rgba(255, 255, 255, 0.1);
        }

        .btn-icon.restart:hover { color: #818cf8; border-color: rgba(129, 140, 248, 0.3); }
        .btn-icon.stop:hover { color: #f87171; border-color: rgba(248, 113, 113, 0.3); }
        .btn-icon.start:hover { color: #34d399; border-color: rgba(52, 211, 153, 0.3); }

        .btn-icon i {
            width: 18px;
            height: 18px;
        }
    `;
  formatBytes(bytes) {
    if (!bytes)
      return "0 B";
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + ["B", "KB", "MB", "GB"][i];
  }
  async action(type) {
    try {
      const res = await fetch(`/api/v1/processes/${this.process.name}/${type}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        this.dispatchEvent(new CustomEvent("refresh-required", { bubbles: true, composed: true }));
      }
    } catch (err) {
      console.error("Action failed", err);
    }
  }
  render() {
    const p = this.process;
    return html4`
            <div class="card">
                <div class="card-header">
                    <div class="info">
                        <h4>${p.name}</h4>
                        <div class="pid">PID: ${p.pid || "N/A"}</div>
                    </div>
                    <span class="status-badge status-${p.state}">${p.state}</span>
                </div>

                <div class="stats">
                    <div class="stat-item">
                        <i data-lucide="activity"></i>
                        <span>${p.cpu || 0}%</span>
                    </div>
                    <div class="stat-item">
                        <i data-lucide="database"></i>
                        <span>${this.formatBytes(p.memory || 0)}</span>
                    </div>
                </div>

                <div class="actions">
                    <button class="btn-icon restart" title="Restart" @click="${() => this.action("restart")}">
                        <i data-lucide="refresh-ccw"></i>
                    </button>
                    ${p.state === "running" ? html4`<button class="btn-icon stop" title="Stop" @click="${() => this.action("stop")}"><i data-lucide="square"></i></button>` : html4`<button class="btn-icon start" title="Start" @click="${() => this.action("start")}"><i data-lucide="play"></i></button>`}
                    <button class="btn-icon" title="Logs" @click="${() => this.dispatchEvent(new CustomEvent("view-logs", { detail: p.name, bubbles: true, composed: true }))}">
                        <i data-lucide="file-text"></i>
                    </button>
                </div>
            </div>
        `;
  }
  updated() {
    if (window.lucide) {
      window.lucide.createIcons({
        attrs: { "stroke-width": 2, class: "lucide-icon" },
        root: this.shadowRoot
      });
    }
  }
}
customElements.define("tspm-process-card", TspmProcessCard);

// src/web/public/components/tspm-process-table.ts
import { LitElement as LitElement5, html as html5, css as css5 } from "https://cdn.jsdelivr.net/npm/lit@3.1.2/+esm";

class TspmProcessTable extends LitElement5 {
  static properties = {
    processes: { type: Array }
  };
  static styles = css5`
        :host {
            display: block;
        }

        .table-container {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.9rem;
        }

        th {
            background: rgba(255, 255, 255, 0.02);
            padding: 1.25rem 1.5rem;
            color: #94a3b8;
            font-weight: 500;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        td {
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            color: #e2e8f0;
        }

        tr:last-child td {
            border-bottom: none;
        }

        tr:hover td {
            background: rgba(255, 255, 255, 0.01);
        }

        .status-badge {
            font-size: 0.75rem;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: 600;
        }

        .status-running { color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .status-stopped { color: #ef4444; background: rgba(239, 68, 68, 0.1); }

        .font-mono {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.8rem;
            color: #94a3b8;
        }

        .actions {
            display: flex;
            gap: 8px;
        }

        .btn-icon {
            padding: 6px;
            background: transparent;
            border: none;
            color: #64748b;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.2s;
        }

        .btn-icon:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.05);
        }
    `;
  formatBytes(bytes) {
    if (!bytes)
      return "0 B";
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + ["B", "KB", "MB", "GB"][i];
  }
  render() {
    return html5`
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Status</th>
                            <th>PID</th>
                            <th>Memory</th>
                            <th>CPU</th>
                            <th>Uptime</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.processes.map((p) => html5`
                            <tr>
                                <td style="font-weight: 600;">${p.name}</td>
                                <td><span class="status-badge status-${p.state}">${p.state}</span></td>
                                <td class="font-mono">#${p.pid || "-"}</td>
                                <td>${this.formatBytes(p.memory || 0)}</td>
                                <td>${p.cpu || 0}%</td>
                                <td>${this.formatUptime(p.uptime)}</td>
                                <td>
                                    <div class="actions">
                                        <button class="btn-icon" @click="${() => this._action(p.name, "restart")}"><i data-lucide="refresh-ccw" style="width:16px"></i></button>
                                        <button class="btn-icon" @click="${() => this._action(p.name, p.state === "running" ? "stop" : "start")}">
                                            <i data-lucide="${p.state === "running" ? "square" : "play"}" style="width:16px"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `)}
                    </tbody>
                </table>
            </div>
        `;
  }
  formatUptime(ms) {
    if (!ms)
      return "-";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  async _action(name, action) {
    await fetch(`/api/v1/processes/${name}/${action}`, { method: "POST" });
    this.dispatchEvent(new CustomEvent("refresh-required", { bubbles: true, composed: true }));
  }
  updated() {
    if (window.lucide) {
      window.lucide.createIcons({
        attrs: { "stroke-width": 2, class: "lucide-icon" },
        root: this.shadowRoot
      });
    }
  }
}
customElements.define("tspm-process-table", TspmProcessTable);

// src/web/public/components/tspm-terminal.ts
import { LitElement as LitElement6, html as html6, css as css6 } from "https://cdn.jsdelivr.net/npm/lit@3.1.2/+esm";

class TspmTerminal extends LitElement6 {
  static properties = {
    active: { type: Boolean },
    history: { type: Array }
  };
  constructor() {
    super();
    this.history = [];
    this._setupListeners();
  }
  _setupListeners() {
    window.addEventListener("terminal-out", (e) => {
      this.history = [...this.history, { text: e.detail, type: "output" }];
      this._scrollToBottom();
    });
  }
  static styles = css6`
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
  async _handleKey(e) {
    if (e.key === "Enter") {
      const cmd = e.target.value.trim();
      if (!cmd)
        return;
      this.history = [...this.history, { text: cmd, type: "input" }];
      e.target.value = "";
      try {
        const res = await fetch("/api/v1/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: cmd })
        });
        const data = await res.json();
        if (data.output)
          this.history = [...this.history, { text: data.output, type: "output" }];
        if (data.error)
          this.history = [...this.history, { text: data.error, type: "error" }];
        this._scrollToBottom();
      } catch (err) {
        this.history = [...this.history, { text: "Execution failed", type: "error" }];
      }
    }
  }
  _scrollToBottom() {
    setTimeout(() => {
      const out = this.shadowRoot.querySelector(".output");
      if (out)
        out.scrollTop = out.scrollHeight;
    }, 0);
  }
  updated(changed) {
    if (changed.has("active") && this.active) {
      this.shadowRoot.querySelector("input")?.focus();
    }
  }
  render() {
    return html6`
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
                    ${this.history.map((line) => html6`
                        <div class="line ${line.type}">${line.type === "input" ? "$ " : ""}${line.text}</div>
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
customElements.define("tspm-terminal", TspmTerminal);

// src/web/public/components/tspm-logs.ts
import { LitElement as LitElement7, html as html7, css as css7 } from "https://cdn.jsdelivr.net/npm/lit@3.1.2/+esm";

class TspmLogs extends LitElement7 {
  static properties = {
    processes: { type: Array },
    selectedProcess: { type: String },
    logs: { type: Array }
  };
  constructor() {
    super();
    this.logs = [];
    this.selectedProcess = "all";
    this._setupListeners();
  }
  _setupListeners() {
    window.addEventListener("new-log", (e) => {
      this.logs = [...this.logs.slice(-999), e.detail];
      this._scrollToBottom();
    });
  }
  static styles = css7`
        :host {
            display: block;
            height: 100%;
        }

        .container {
            background: rgba(15, 15, 20, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            height: 600px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .header {
            padding: 1rem;
            background: rgba(255, 255, 255, 0.02);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        select {
            background: #1a1a1a;
            color: #fff;
            border: 1px solid #333;
            padding: 6px 12px;
            border-radius: 8px;
            font-family: inherit;
        }

        .output {
            flex: 1;
            padding: 1rem;
            overflow-y: auto;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.85rem;
            scrollbar-width: thin;
        }

        .output::-webkit-scrollbar { width: 6px; }
        .output::-webkit-scrollbar-thumb { background: #333; }

        .line {
            margin-bottom: 4px;
            display: flex;
            gap: 12px;
        }

        .timestamp { color: #64748b; min-width: 80px; }
        .proc { color: #818cf8; font-weight: 600; min-width: 100px; }
        .msg { color: #e2e8f0; white-space: pre-wrap; word-break: break-all; }

        .controls { display: flex; gap: 10px; }
        .btn-icon {
            background: transparent;
            border: none;
            color: #64748b;
            cursor: pointer;
            padding: 4px;
        }
        .btn-icon:hover { color: #fff; }
    `;
  _scrollToBottom() {
    const out = this.shadowRoot.querySelector(".output");
    if (out)
      out.scrollTop = out.scrollHeight;
  }
  render() {
    const filteredLogs = this.selectedProcess === "all" ? this.logs : this.logs.filter((l) => l.processName === this.selectedProcess);
    return html7`
            <div class="container">
                <div class="header">
                    <select @change="${(e) => this.selectedProcess = e.target.value}">
                        <option value="all">Global Logs</option>
                        ${this.processes.map((p) => html7`<option value="${p.name}" ?selected="${this.selectedProcess === p.name}">${p.name}</option>`)}
                    </select>
                    <div class="controls">
                        <button class="btn-icon" title="Clear" @click="${() => this.logs = []}">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
                <div class="output">
                    ${filteredLogs.map((log) => html7`
                        <div class="line">
                            <span class="timestamp">[${new Date().toLocaleTimeString()}]</span>
                            <span class="proc">[${log.processName}]</span>
                            <span class="msg">${log.message}</span>
                        </div>
                    `)}
                </div>
            </div>
        `;
  }
  updated() {
    if (window.lucide) {
      window.lucide.createIcons({
        attrs: { "stroke-width": 2, class: "lucide-icon" },
        root: this.shadowRoot
      });
    }
  }
}
customElements.define("tspm-logs", TspmLogs);

// src/web/public/components/tspm-modal.ts
import { LitElement as LitElement8, html as html8, css as css8 } from "https://cdn.jsdelivr.net/npm/lit@3.1.2/+esm";

class TspmModal extends LitElement8 {
  static properties = {
    isOpen: { type: Boolean }
  };
  constructor() {
    super();
    this.isOpen = false;
  }
  open() {
    this.isOpen = true;
  }
  close() {
    this.isOpen = false;
  }
  static styles = css8`
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
  async _handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const config = Object.fromEntries(formData.entries());
    try {
      const res = await fetch(`/api/v1/processes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        this.close();
        this.dispatchEvent(new CustomEvent("process-added", { bubbles: true, composed: true }));
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Failed to spawn process");
    }
  }
  render() {
    return html8`
            <div class="overlay ${this.isOpen ? "active" : ""}" @click="${(e) => e.target.classList.contains("overlay") && this.close()}">
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
customElements.define("tspm-modal", TspmModal);

// src/web/public/components/tspm-app.ts
import { LitElement as LitElement9, html as html9, css as css9 } from "https://cdn.jsdelivr.net/npm/lit@3.1.2/+esm";

class TspmApp extends LitElement9 {
  static properties = {
    currentView: { type: String },
    processes: { type: Array },
    systemStats: { type: Object },
    socket: { type: Object },
    isOnline: { type: Boolean }
  };
  constructor() {
    super();
    this.currentView = "dashboard";
    this.processes = [];
    this.systemStats = { cpu: 0, memory: 0, uptime: 0 };
    this.isOnline = false;
    this.connect();
    this.addEventListener("view-logs", (e) => {
      this.currentView = "logs";
      this.updateComplete.then(() => {
        const logsComp = this.shadowRoot.querySelector("tspm-logs");
        if (logsComp)
          logsComp.selectedProcess = e.detail;
      });
    });
    this.addEventListener("refresh-required", () => this.fetchData());
  }
  connect() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    this.socket = new WebSocket(`${protocol}//${host}/ws`);
    this.socket.onopen = () => {
      console.log("Connected to TSPM Node");
      this.isOnline = true;
      this.fetchData();
    };
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleUpdate(data);
    };
    this.socket.onclose = () => {
      console.log("Disconnected from TSPM Node");
      this.isOnline = false;
      setTimeout(() => this.connect(), 3000);
    };
  }
  handleUpdate(data) {
    switch (data.type) {
      case "process:update":
        this.processes = data.payload;
        break;
      case "process:log":
        this.dispatchEvent(new CustomEvent("new-log", { detail: data.payload, bubbles: true, composed: true }));
        break;
      case "terminal:out":
        this.dispatchEvent(new CustomEvent("terminal-out", { detail: data.payload, bubbles: true, composed: true }));
        break;
      case "system:stats":
        this.systemStats = data.payload;
        break;
    }
  }
  async fetchData() {
    try {
      const res = await fetch("/api/v1/status");
      const data = await res.json();
      if (data.success) {
        this.processes = data.data.processes;
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  }
  static styles = css9`
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
  render() {
    return html9`
            <tspm-sidebar 
                .currentView="${this.currentView}" 
                .isOnline="${this.isOnline}"
                @view-change="${(e) => this.currentView = e.detail}"
            ></tspm-sidebar>
            
            <main class="main-content">
                <tspm-topbar 
                    @refresh="${this.fetchData}"
                    @open-modal="${() => this.shadowRoot.querySelector("tspm-modal").open()}"
                ></tspm-topbar>
                
                <div class="view-container">
                    <tspm-dashboard 
                        class="view ${this.currentView === "dashboard" ? "active" : ""}"
                        .processes="${this.processes}"
                        .stats="${this.systemStats}"
                    ></tspm-dashboard>

                    <tspm-process-table
                        class="view ${this.currentView === "processes" ? "active" : ""}"
                        .processes="${this.processes}"
                    ></tspm-process-table>

                    <tspm-terminal
                        class="view ${this.currentView === "terminal" ? "active" : ""}"
                        ?active="${this.currentView === "terminal"}"
                    ></tspm-terminal>

                    <tspm-logs
                        class="view ${this.currentView === "logs" ? "active" : ""}"
                        .processes="${this.processes}"
                    ></tspm-logs>
                </div>
            </main>

            <tspm-modal @process-added="${this.fetchData}"></tspm-modal>
        `;
  }
}
customElements.define("tspm-app", TspmApp);

// src/web/public/main.ts
console.log("TSPM Web Components Loaded");

//# debugId=B24FAAF65B7F51A864756E2164756E21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL3dlYi9wdWJsaWMvY29tcG9uZW50cy90c3BtLXNpZGViYXIudHMiLCAiLi4vLi4vc3JjL3dlYi9wdWJsaWMvY29tcG9uZW50cy90c3BtLXRvcGJhci50cyIsICIuLi8uLi9zcmMvd2ViL3B1YmxpYy9jb21wb25lbnRzL3RzcG0tZGFzaGJvYXJkLnRzIiwgIi4uLy4uL3NyYy93ZWIvcHVibGljL2NvbXBvbmVudHMvdHNwbS1wcm9jZXNzLWNhcmQudHMiLCAiLi4vLi4vc3JjL3dlYi9wdWJsaWMvY29tcG9uZW50cy90c3BtLXByb2Nlc3MtdGFibGUudHMiLCAiLi4vLi4vc3JjL3dlYi9wdWJsaWMvY29tcG9uZW50cy90c3BtLXRlcm1pbmFsLnRzIiwgIi4uLy4uL3NyYy93ZWIvcHVibGljL2NvbXBvbmVudHMvdHNwbS1sb2dzLnRzIiwgIi4uLy4uL3NyYy93ZWIvcHVibGljL2NvbXBvbmVudHMvdHNwbS1tb2RhbC50cyIsICIuLi8uLi9zcmMvd2ViL3B1YmxpYy9jb21wb25lbnRzL3RzcG0tYXBwLnRzIiwgIi4uLy4uL3NyYy93ZWIvcHVibGljL21haW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbCiAgICAiaW1wb3J0IHsgTGl0RWxlbWVudCwgaHRtbCwgY3NzIH0gZnJvbSAnaHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L25wbS9saXRAMy4xLjIvK2VzbSc7XG5cbmV4cG9ydCBjbGFzcyBUc3BtU2lkZWJhciBleHRlbmRzIExpdEVsZW1lbnQge1xuICAgIHN0YXRpYyBwcm9wZXJ0aWVzID0ge1xuICAgICAgICBjdXJyZW50VmlldzogeyB0eXBlOiBTdHJpbmcgfSxcbiAgICAgICAgaXNPbmxpbmU6IHsgdHlwZTogQm9vbGVhbiB9XG4gICAgfTtcblxuICAgIHN0YXRpYyBzdHlsZXMgPSBjc3NgXG4gICAgICAgIDpob3N0IHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMTUsIDE1LCAyMCwgMC44KTtcbiAgICAgICAgICAgIGJhY2tkcm9wLWZpbHRlcjogYmx1cigxMnB4KTtcbiAgICAgICAgICAgIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSk7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgICAgIHBhZGRpbmc6IDEuNXJlbSAxcmVtO1xuICAgICAgICAgICAgei1pbmRleDogMTAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLmxvZ28ge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgICBnYXA6IDEycHg7XG4gICAgICAgICAgICBwYWRkaW5nOiAxcmVtO1xuICAgICAgICAgICAgbWFyZ2luLWJvdHRvbTogMnJlbTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5sb2dvLWljb24ge1xuICAgICAgICAgICAgd2lkdGg6IDMycHg7XG4gICAgICAgICAgICBoZWlnaHQ6IDMycHg7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAjNjM2NmYxIDAlLCAjYTg1NWY3IDEwMCUpO1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogOHB4O1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xuICAgICAgICAgICAgY29sb3I6IHdoaXRlO1xuICAgICAgICAgICAgYm94LXNoYWRvdzogMCA0cHggMTJweCByZ2JhKDk5LCAxMDIsIDI0MSwgMC4zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5sb2dvLXRleHQge1xuICAgICAgICAgICAgZm9udC1zaXplOiAxLjI1cmVtO1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICAgICAgICAgIGxldHRlci1zcGFjaW5nOiAtMC41cHg7XG4gICAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgfVxuXG4gICAgICAgIC5uYXYtbGlua3Mge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgICBnYXA6IDAuNXJlbTtcbiAgICAgICAgICAgIGZsZXg6IDE7XG4gICAgICAgIH1cblxuICAgICAgICAubmF2LWJ0biB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgIGdhcDogMTJweDtcbiAgICAgICAgICAgIHBhZGRpbmc6IDAuODc1cmVtIDFyZW07XG4gICAgICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgICAgICAgICAgIGNvbG9yOiAjOTRhM2I4O1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMTJweDtcbiAgICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICAgIHRyYW5zaXRpb246IGFsbCAwLjJzIGN1YmljLWJlemllcigwLjQsIDAsIDAuMiwgMSk7XG4gICAgICAgICAgICBmb250LXNpemU6IDAuOTVyZW07XG4gICAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgICAgdGV4dC1hbGlnbjogbGVmdDtcbiAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICB9XG5cbiAgICAgICAgLm5hdi1idG46aG92ZXIge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKTtcbiAgICAgICAgICAgIGNvbG9yOiAjZmZmO1xuICAgICAgICB9XG5cbiAgICAgICAgLm5hdi1idG4uYWN0aXZlIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoOTksIDEwMiwgMjQxLCAwLjEpO1xuICAgICAgICAgICAgY29sb3I6ICM4MThjZjg7XG4gICAgICAgIH1cblxuICAgICAgICAubmF2LWJ0biBpIHtcbiAgICAgICAgICAgIHdpZHRoOiAyMHB4O1xuICAgICAgICAgICAgaGVpZ2h0OiAyMHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnNpZGViYXItZm9vdGVyIHtcbiAgICAgICAgICAgIG1hcmdpbi10b3A6IGF1dG87XG4gICAgICAgICAgICBwYWRkaW5nOiAxcmVtO1xuICAgICAgICAgICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSk7XG4gICAgICAgIH1cblxuICAgICAgICAuc3lzdGVtLXN0YXR1cyB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgIGdhcDogMTBweDtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMC44NXJlbTtcbiAgICAgICAgICAgIGNvbG9yOiAjNjQ3NDhiO1xuICAgICAgICB9XG5cbiAgICAgICAgLnN0YXR1cy1kb3Qge1xuICAgICAgICAgICAgd2lkdGg6IDhweDtcbiAgICAgICAgICAgIGhlaWdodDogOHB4O1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNTAlO1xuICAgICAgICAgICAgYmFja2dyb3VuZDogIzQ3NTU2OTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0dXMtZG90Lm9ubGluZSB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjMTBiOTgxO1xuICAgICAgICAgICAgYm94LXNoYWRvdzogMCAwIDhweCByZ2JhKDE2LCAxODUsIDEyOSwgMC41KTtcbiAgICAgICAgfVxuXG4gICAgICAgIEBtZWRpYSAobWF4LXdpZHRoOiA3NjhweCkge1xuICAgICAgICAgICAgLmxvZ28tdGV4dCwgLm5hdi1idG4gc3BhbiwgLnN5c3RlbS1zdGF0dXMgc3BhbiB7XG4gICAgICAgICAgICAgICAgZGlzcGxheTogbm9uZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC5uYXYtYnRuIHtcbiAgICAgICAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAxcmVtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLmxvZ28ge1xuICAgICAgICAgICAgICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgICAgICAgICAgIHBhZGRpbmc6IDFyZW0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIGA7XG5cbiAgICBfY2hhbmdlVmlldyh2aWV3KSB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ3ZpZXctY2hhbmdlJywgeyBkZXRhaWw6IHZpZXcgfSkpO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgcmV0dXJuIGh0bWxgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibG9nb1wiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJsb2dvLWljb25cIj5UPC9kaXY+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJsb2dvLXRleHRcIj5UU1BNPC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJuYXYtbGlua3NcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwibmF2LWJ0biAke3RoaXMuY3VycmVudFZpZXcgPT09ICdkYXNoYm9hcmQnID8gJ2FjdGl2ZScgOiAnJ31cIiBAY2xpY2s9XCIkeygpID0+IHRoaXMuX2NoYW5nZVZpZXcoJ2Rhc2hib2FyZCcpfVwiPlxuICAgICAgICAgICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT1cImxheW91dC1kYXNoYm9hcmRcIj48L2k+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPkRhc2hib2FyZDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwibmF2LWJ0biAke3RoaXMuY3VycmVudFZpZXcgPT09ICdwcm9jZXNzZXMnID8gJ2FjdGl2ZScgOiAnJ31cIiBAY2xpY2s9XCIkeygpID0+IHRoaXMuX2NoYW5nZVZpZXcoJ3Byb2Nlc3NlcycpfVwiPlxuICAgICAgICAgICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT1cImNwdVwiPjwvaT5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+UHJvY2Vzc2VzPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJuYXYtYnRuICR7dGhpcy5jdXJyZW50VmlldyA9PT0gJ3Rlcm1pbmFsJyA/ICdhY3RpdmUnIDogJyd9XCIgQGNsaWNrPVwiJHsoKSA9PiB0aGlzLl9jaGFuZ2VWaWV3KCd0ZXJtaW5hbCcpfVwiPlxuICAgICAgICAgICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT1cInRlcm1pbmFsXCI+PC9pPlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj5FeGVjdXRvcjwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwibmF2LWJ0biAke3RoaXMuY3VycmVudFZpZXcgPT09ICdsb2dzJyA/ICdhY3RpdmUnIDogJyd9XCIgQGNsaWNrPVwiJHsoKSA9PiB0aGlzLl9jaGFuZ2VWaWV3KCdsb2dzJyl9XCI+XG4gICAgICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPVwiZmlsZS10ZXh0XCI+PC9pPlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj5MaXZlIExvZ3M8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNpZGViYXItZm9vdGVyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN5c3RlbS1zdGF0dXNcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXR1cy1kb3QgJHt0aGlzLmlzT25saW5lID8gJ29ubGluZScgOiAnJ31cIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+U3lzdGVtICR7dGhpcy5pc09ubGluZSA/ICdPbmxpbmUnIDogJ09mZmxpbmUnfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgO1xuICAgIH1cblxuICAgIHVwZGF0ZWQoKSB7XG4gICAgICAgIC8vIEx1Y2lkZSBpY29ucyBuZWVkIHRvIGJlIGluaXRpYWxpemVkIGFmdGVyIHJlbmRlclxuICAgICAgICBpZiAod2luZG93Lmx1Y2lkZSkge1xuICAgICAgICAgICAgd2luZG93Lmx1Y2lkZS5jcmVhdGVJY29ucyh7XG4gICAgICAgICAgICAgICAgYXR0cnM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ3N0cm9rZS13aWR0aCc6IDIsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcyc6ICdsdWNpZGUtaWNvbidcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG5hbWVBdHRyOiAnZGF0YS1sdWNpZGUnLFxuICAgICAgICAgICAgICAgIHJvb3Q6IHRoaXMuc2hhZG93Um9vdFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZSgndHNwbS1zaWRlYmFyJywgVHNwbVNpZGViYXIpO1xuIiwKICAgICJpbXBvcnQgeyBMaXRFbGVtZW50LCBodG1sLCBjc3MgfSBmcm9tICdodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvbnBtL2xpdEAzLjEuMi8rZXNtJztcblxuZXhwb3J0IGNsYXNzIFRzcG1Ub3BiYXIgZXh0ZW5kcyBMaXRFbGVtZW50IHtcbiAgICBzdGF0aWMgc3R5bGVzID0gY3NzYFxuICAgICAgICA6aG9zdCB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgICAgIHBhZGRpbmc6IDEuMjVyZW0gMnJlbTtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMTAsIDEwLCAxMiwgMC40KTtcbiAgICAgICAgICAgIGJhY2tkcm9wLWZpbHRlcjogYmx1cig4cHgpO1xuICAgICAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSk7XG4gICAgICAgICAgICBoZWlnaHQ6IDcycHg7XG4gICAgICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICAgICAgICB9XG5cbiAgICAgICAgLnNlYXJjaC1jb250YWluZXIge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpO1xuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KTtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgICAgICAgICBwYWRkaW5nOiAwLjZyZW0gMXJlbTtcbiAgICAgICAgICAgIHdpZHRoOiA0MDBweDtcbiAgICAgICAgICAgIGdhcDogMTJweDtcbiAgICAgICAgICAgIHRyYW5zaXRpb246IGFsbCAwLjJzIGVhc2U7XG4gICAgICAgIH1cblxuICAgICAgICAuc2VhcmNoLWNvbnRhaW5lcjpmb2N1cy13aXRoaW4ge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KTtcbiAgICAgICAgICAgIGJvcmRlci1jb2xvcjogcmdiYSg5OSwgMTAyLCAyNDEsIDAuMyk7XG4gICAgICAgICAgICBib3gtc2hhZG93OiAwIDAgMCAycHggcmdiYSg5OSwgMTAyLCAyNDEsIDAuMSk7XG4gICAgICAgIH1cblxuICAgICAgICAuc2VhcmNoLWNvbnRhaW5lciBpIHtcbiAgICAgICAgICAgIGNvbG9yOiAjNjQ3NDhiO1xuICAgICAgICAgICAgd2lkdGg6IDE4cHg7XG4gICAgICAgICAgICBoZWlnaHQ6IDE4cHg7XG4gICAgICAgIH1cblxuICAgICAgICAuc2VhcmNoLWNvbnRhaW5lciBpbnB1dCB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICAgIGNvbG9yOiAjZmZmO1xuICAgICAgICAgICAgb3V0bGluZTogbm9uZTtcbiAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgZm9udC1mYW1pbHk6IGluaGVyaXQ7XG4gICAgICAgICAgICBmb250LXNpemU6IDAuOXJlbTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5hY3Rpb25zIHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICBnYXA6IDAuNzVyZW07XG4gICAgICAgIH1cblxuICAgICAgICAuYnRuIHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICAgICAgcGFkZGluZzogMC42cmVtIDFyZW07XG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICAgICAgICAgICAgZm9udC1zaXplOiAwLjlyZW07XG4gICAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgICAgdHJhbnNpdGlvbjogYWxsIDAuMnMgZWFzZTtcbiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHRyYW5zcGFyZW50O1xuICAgICAgICAgICAgZm9udC1mYW1pbHk6IGluaGVyaXQ7XG4gICAgICAgIH1cblxuICAgICAgICAuYnRuLXByaW1hcnkge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogIzYzNjZmMTtcbiAgICAgICAgICAgIGNvbG9yOiB3aGl0ZTtcbiAgICAgICAgICAgIGJveC1zaGFkb3c6IDAgNHB4IDEycHggcmdiYSg5OSwgMTAyLCAyNDEsIDAuMik7XG4gICAgICAgIH1cblxuICAgICAgICAuYnRuLXByaW1hcnk6aG92ZXIge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogIzRmNDZlNTtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtMXB4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5idG4tc2Vjb25kYXJ5IHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSk7XG4gICAgICAgICAgICBjb2xvcjogI2UyZThmMDtcbiAgICAgICAgICAgIGJvcmRlci1jb2xvcjogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLmJ0bi1zZWNvbmRhcnk6aG92ZXIge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5idG4taWNvbiB7XG4gICAgICAgICAgICBwYWRkaW5nOiAwLjZyZW07XG4gICAgICAgICAgICBhc3BlY3QtcmF0aW86IDE7XG4gICAgICAgIH1cblxuICAgICAgICBAbWVkaWEgKG1heC13aWR0aDogNjQwcHgpIHtcbiAgICAgICAgICAgIC5zZWFyY2gtY29udGFpbmVyIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiBub25lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgYDtcblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgcmV0dXJuIGh0bWxgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwic2VhcmNoLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPVwic2VhcmNoXCI+PC9pPlxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwiU2VhcmNoIHByb2Nlc3NlcywgbG9ncywgY29tbWFuZHMuLi5cIiAvPlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhY3Rpb25zXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tc2Vjb25kYXJ5IGJ0bi1pY29uXCIgQGNsaWNrPVwiJHsoKSA9PiB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCdyZWZyZXNoJykpfVwiPlxuICAgICAgICAgICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT1cInJlZnJlc2gtY3dcIj48L2k+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tcHJpbWFyeVwiIEBjbGljaz1cIiR7KCkgPT4gdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnb3Blbi1tb2RhbCcpKX1cIj5cbiAgICAgICAgICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9XCJwbHVzXCI+PC9pPlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj5OZXcgUHJvY2Vzczwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgO1xuICAgIH1cblxuICAgIHVwZGF0ZWQoKSB7XG4gICAgICAgIGlmICh3aW5kb3cubHVjaWRlKSB7XG4gICAgICAgICAgICB3aW5kb3cubHVjaWRlLmNyZWF0ZUljb25zKHtcbiAgICAgICAgICAgICAgICBhdHRyczogeyAnc3Ryb2tlLXdpZHRoJzogMiwgJ2NsYXNzJzogJ2x1Y2lkZS1pY29uJyB9LFxuICAgICAgICAgICAgICAgIHJvb3Q6IHRoaXMuc2hhZG93Um9vdFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZSgndHNwbS10b3BiYXInLCBUc3BtVG9wYmFyKTtcbiIsCiAgICAiaW1wb3J0IHsgTGl0RWxlbWVudCwgaHRtbCwgY3NzIH0gZnJvbSAnaHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L25wbS9saXRAMy4xLjIvK2VzbSc7XG5cbmV4cG9ydCBjbGFzcyBUc3BtRGFzaGJvYXJkIGV4dGVuZHMgTGl0RWxlbWVudCB7XG4gICAgc3RhdGljIHByb3BlcnRpZXMgPSB7XG4gICAgICAgIHByb2Nlc3NlczogeyB0eXBlOiBBcnJheSB9LFxuICAgICAgICBzdGF0czogeyB0eXBlOiBPYmplY3QgfVxuICAgIH07XG5cbiAgICBzdGF0aWMgc3R5bGVzID0gY3NzYFxuICAgICAgICA6aG9zdCB7XG4gICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0cy1ncmlkIHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgICAgICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdChhdXRvLWZpdCwgbWlubWF4KDI0MHB4LCAxZnIpKTtcbiAgICAgICAgICAgIGdhcDogMS41cmVtO1xuICAgICAgICAgICAgbWFyZ2luLWJvdHRvbTogMi41cmVtO1xuICAgICAgICB9XG5cbiAgICAgICAgLnN0YXQtY2FyZCB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpO1xuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KTtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDIwcHg7XG4gICAgICAgICAgICBwYWRkaW5nOiAxLjVyZW07XG4gICAgICAgICAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICAgICAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDAuMnMgZWFzZSwgYmFja2dyb3VuZCAwLjJzIGVhc2U7XG4gICAgICAgIH1cblxuICAgICAgICAuc3RhdC1jYXJkOmhvdmVyIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSk7XG4gICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTJweCk7XG4gICAgICAgIH1cblxuICAgICAgICAuc3RhdC1oZWFkZXIge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICAgICAgICAgICAgbWFyZ2luLWJvdHRvbTogMXJlbTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0LWhlYWRlciBoMyB7XG4gICAgICAgICAgICBtYXJnaW46IDA7XG4gICAgICAgICAgICBmb250LXNpemU6IDAuOXJlbTtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA1MDA7XG4gICAgICAgICAgICBjb2xvcjogIzk0YTNiODtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0LWhlYWRlciBpIHtcbiAgICAgICAgICAgIGNvbG9yOiAjNjM2NmYxO1xuICAgICAgICAgICAgd2lkdGg6IDIwcHg7XG4gICAgICAgICAgICBoZWlnaHQ6IDIwcHg7XG4gICAgICAgIH1cblxuICAgICAgICAuc3RhdC12YWx1ZSB7XG4gICAgICAgICAgICBmb250LXNpemU6IDJyZW07XG4gICAgICAgICAgICBmb250LXdlaWdodDogNzAwO1xuICAgICAgICAgICAgY29sb3I6ICNmZmY7XG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAwLjVyZW07XG4gICAgICAgIH1cblxuICAgICAgICAuc3RhdC1mb290ZXIge1xuICAgICAgICAgICAgZm9udC1zaXplOiAwLjg1cmVtO1xuICAgICAgICB9XG5cbiAgICAgICAgLnRleHQtc3VjY2VzcyB7IGNvbG9yOiAjMTBiOTgxOyB9XG4gICAgICAgIC50ZXh0LW11dGVkIHsgY29sb3I6ICM2NDc0OGI7IH1cblxuICAgICAgICAucHJvZ3Jlc3MtYmFyIHtcbiAgICAgICAgICAgIGhlaWdodDogNHB4O1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KTtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDJweDtcbiAgICAgICAgICAgIG1hcmdpbi10b3A6IDFyZW07XG4gICAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICB9XG5cbiAgICAgICAgLnByb2dyZXNzIHtcbiAgICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCg5MGRlZywgIzYzNjZmMSwgI2E4NTVmNyk7XG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiAycHg7XG4gICAgICAgICAgICB0cmFuc2l0aW9uOiB3aWR0aCAwLjNzIGVhc2U7XG4gICAgICAgIH1cblxuICAgICAgICAuc2VjdGlvbi1oZWFkZXIge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAxLjVyZW07XG4gICAgICAgIH1cblxuICAgICAgICAuc2VjdGlvbi1oZWFkZXIgaDIge1xuICAgICAgICAgICAgbWFyZ2luOiAwO1xuICAgICAgICAgICAgZm9udC1zaXplOiAxLjVyZW07XG4gICAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLnByb2Nlc3MtZ3JpZCB7XG4gICAgICAgICAgICBkaXNwbGF5OiBncmlkO1xuICAgICAgICAgICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiByZXBlYXQoYXV0by1maWxsLCBtaW5tYXgoMzIwcHgsIDFmcikpO1xuICAgICAgICAgICAgZ2FwOiAxLjVyZW07XG4gICAgICAgIH1cblxuICAgICAgICAubG9hZGluZy1zdGF0ZSB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICAgIHBhZGRpbmc6IDRyZW07XG4gICAgICAgICAgICBjb2xvcjogIzY0NzQ4YjtcbiAgICAgICAgICAgIGdyaWQtY29sdW1uOiAxIC8gLTE7XG4gICAgICAgIH1cblxuICAgICAgICAuc3BpbiB7XG4gICAgICAgICAgICBhbmltYXRpb246IHNwaW4gMnMgbGluZWFyIGluZmluaXRlO1xuICAgICAgICAgICAgd2lkdGg6IDMycHg7XG4gICAgICAgICAgICBoZWlnaHQ6IDMycHg7XG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAxcmVtO1xuICAgICAgICB9XG5cbiAgICAgICAgQGtleWZyYW1lcyBzcGluIHtcbiAgICAgICAgICAgIGZyb20geyB0cmFuc2Zvcm06IHJvdGF0ZSgwZGVnKTsgfVxuICAgICAgICAgICAgdG8geyB0cmFuc2Zvcm06IHJvdGF0ZSgzNjBkZWcpOyB9XG4gICAgICAgIH1cbiAgICBgO1xuXG4gICAgZm9ybWF0Qnl0ZXMoYnl0ZXMpIHtcbiAgICAgICAgaWYgKCFieXRlcykgcmV0dXJuICcwIEInO1xuICAgICAgICBjb25zdCBrID0gMTAyNDtcbiAgICAgICAgY29uc3Qgc2l6ZXMgPSBbJ0InLCAnS0InLCAnTUInLCAnR0InLCAnVEInXTtcbiAgICAgICAgY29uc3QgaSA9IE1hdGguZmxvb3IoTWF0aC5sb2coYnl0ZXMpIC8gTWF0aC5sb2coaykpO1xuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCgoYnl0ZXMgLyBNYXRoLnBvdyhrLCBpKSkudG9GaXhlZCgyKSkgKyAnICcgKyBzaXplc1tpXTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IHRvdGFsQ3B1ID0gdGhpcy5wcm9jZXNzZXMucmVkdWNlKChhY2MsIHApID0+IGFjYyArIChwLmNwdSB8fCAwKSwgMCk7XG4gICAgICAgIGNvbnN0IHRvdGFsTWVtID0gdGhpcy5wcm9jZXNzZXMucmVkdWNlKChhY2MsIHApID0+IGFjYyArIChwLm1lbW9yeSB8fCAwKSwgMCk7XG5cbiAgICAgICAgcmV0dXJuIGh0bWxgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdHMtZ3JpZFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LWNhcmRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDM+VG90YWwgUHJvY2Vzc2VzPC9oMz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPVwibGF5ZXJzXCI+PC9pPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtdmFsdWVcIj4ke3RoaXMucHJvY2Vzc2VzLmxlbmd0aH08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtZm9vdGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInRleHQtc3VjY2Vzc1wiPkFjdGl2ZSAmIE1vbml0b3Jpbmc8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtY2FyZFwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdC1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMz5BY3RpdmUgQ1BVIFVzYWdlPC9oMz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPVwiYWN0aXZpdHlcIj48L2k+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdC12YWx1ZVwiPiR7TWF0aC5yb3VuZCh0b3RhbENwdSl9JTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdC1mb290ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwcm9ncmVzcy1iYXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicHJvZ3Jlc3NcIiBzdHlsZT1cIndpZHRoOiAke01hdGgubWluKDEwMCwgdG90YWxDcHUpfSVcIj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LWNhcmRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDM+VG90YWwgTWVtb3J5PC9oMz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPVwiZGF0YWJhc2VcIj48L2k+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdC12YWx1ZVwiPiR7dGhpcy5mb3JtYXRCeXRlcyh0b3RhbE1lbSl9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LWZvb3RlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0LW11dGVkXCI+VG90YWwgYWxsb2NhdGVkPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LWNhcmRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXQtaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDM+U3lzdGVtIEhlYWx0aDwvaDM+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aSBkYXRhLWx1Y2lkZT1cInNoaWVsZC1jaGVja1wiPjwvaT5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LXZhbHVlXCI+U3RhYmxlPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LWZvb3RlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0ZXh0LXN1Y2Nlc3NcIj5BbGwgc2VydmljZXMgb3BlcmF0aW9uYWw8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzZWN0aW9uLWhlYWRlclwiPlxuICAgICAgICAgICAgICAgIDxoMj5SdW5uaW5nIFByb2Nlc3NlczwvaDI+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInByb2Nlc3MtZ3JpZFwiPlxuICAgICAgICAgICAgICAgICR7dGhpcy5wcm9jZXNzZXMubGVuZ3RoID09PSAwID8gaHRtbGBcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImxvYWRpbmctc3RhdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPVwibG9hZGVyLTJcIiBjbGFzcz1cInNwaW5cIj48L2k+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cD5XYWl0aW5nIGZvciBwcm9jZXNzIGRhdGEuLi48L3A+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIGAgOiB0aGlzLnByb2Nlc3Nlcy5tYXAocCA9PiBodG1sYFxuICAgICAgICAgICAgICAgICAgICA8dHNwbS1wcm9jZXNzLWNhcmQgLnByb2Nlc3M9XCIke3B9XCI+PC90c3BtLXByb2Nlc3MtY2FyZD5cbiAgICAgICAgICAgICAgICBgKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgO1xuICAgIH1cblxuICAgIHVwZGF0ZWQoKSB7XG4gICAgICAgIGlmICh3aW5kb3cubHVjaWRlKSB7XG4gICAgICAgICAgICB3aW5kb3cubHVjaWRlLmNyZWF0ZUljb25zKHtcbiAgICAgICAgICAgICAgICBhdHRyczogeyAnc3Ryb2tlLXdpZHRoJzogMiwgJ2NsYXNzJzogJ2x1Y2lkZS1pY29uJyB9LFxuICAgICAgICAgICAgICAgIHJvb3Q6IHRoaXMuc2hhZG93Um9vdFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZSgndHNwbS1kYXNoYm9hcmQnLCBUc3BtRGFzaGJvYXJkKTtcbiIsCiAgICAiaW1wb3J0IHsgTGl0RWxlbWVudCwgaHRtbCwgY3NzIH0gZnJvbSAnaHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L25wbS9saXRAMy4xLjIvK2VzbSc7XG5cbmV4cG9ydCBjbGFzcyBUc3BtUHJvY2Vzc0NhcmQgZXh0ZW5kcyBMaXRFbGVtZW50IHtcbiAgICBzdGF0aWMgcHJvcGVydGllcyA9IHtcbiAgICAgICAgcHJvY2VzczogeyB0eXBlOiBPYmplY3QgfVxuICAgIH07XG5cbiAgICBzdGF0aWMgc3R5bGVzID0gY3NzYFxuICAgICAgICA6aG9zdCB7XG4gICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgfVxuXG4gICAgICAgIC5jYXJkIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wMyk7XG4gICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpO1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMTZweDtcbiAgICAgICAgICAgIHBhZGRpbmc6IDEuMjVyZW07XG4gICAgICAgICAgICB0cmFuc2l0aW9uOiBhbGwgMC4ycyBlYXNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLmNhcmQ6aG92ZXIge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KTtcbiAgICAgICAgICAgIGJvcmRlci1jb2xvcjogcmdiYSg5OSwgMTAyLCAyNDEsIDAuMik7XG4gICAgICAgICAgICBib3gtc2hhZG93OiAwIDhweCAzMnB4IHJnYmEoMCwgMCwgMCwgMC4yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5jYXJkLWhlYWRlciB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAxLjI1cmVtO1xuICAgICAgICB9XG5cbiAgICAgICAgLmluZm8gaDQge1xuICAgICAgICAgICAgbWFyZ2luOiAwO1xuICAgICAgICAgICAgZm9udC1zaXplOiAxLjFyZW07XG4gICAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgICAgY29sb3I6ICNmZmY7XG4gICAgICAgIH1cblxuICAgICAgICAucGlkIHtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMC43NXJlbTtcbiAgICAgICAgICAgIGNvbG9yOiAjNjQ3NDhiO1xuICAgICAgICAgICAgZm9udC1mYW1pbHk6ICdKZXRCcmFpbnMgTW9ubycsIG1vbm9zcGFjZTtcbiAgICAgICAgICAgIG1hcmdpbi10b3A6IDRweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0dXMtYmFkZ2Uge1xuICAgICAgICAgICAgZm9udC1zaXplOiAwLjdyZW07XG4gICAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgICAgICAgICAgIHBhZGRpbmc6IDRweCAxMHB4O1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMjBweDtcbiAgICAgICAgICAgIGxldHRlci1zcGFjaW5nOiAwLjVweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0dXMtcnVubmluZyB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDE2LCAxODUsIDEyOSwgMC4xKTtcbiAgICAgICAgICAgIGNvbG9yOiAjMTBiOTgxO1xuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgxNiwgMTg1LCAxMjksIDAuMik7XG4gICAgICAgIH1cblxuICAgICAgICAuc3RhdHVzLXN0b3BwZWQge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyMzksIDY4LCA2OCwgMC4xKTtcbiAgICAgICAgICAgIGNvbG9yOiAjZWY0NDQ0O1xuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyMzksIDY4LCA2OCwgMC4yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0cyB7XG4gICAgICAgICAgICBkaXNwbGF5OiBncmlkO1xuICAgICAgICAgICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAxZnIgMWZyO1xuICAgICAgICAgICAgZ2FwOiAxcmVtO1xuICAgICAgICAgICAgbWFyZ2luLWJvdHRvbTogMS41cmVtO1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgwLCAwLCAwLCAwLjIpO1xuICAgICAgICAgICAgcGFkZGluZzogMC44NzVyZW07XG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiAxMnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnN0YXQtaXRlbSB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICAgICAgZm9udC1zaXplOiAwLjg1cmVtO1xuICAgICAgICAgICAgY29sb3I6ICM5NGEzYjg7XG4gICAgICAgIH1cblxuICAgICAgICAuc3RhdC1pdGVtIGkge1xuICAgICAgICAgICAgd2lkdGg6IDE0cHg7XG4gICAgICAgICAgICBoZWlnaHQ6IDE0cHg7XG4gICAgICAgICAgICBjb2xvcjogIzYzNjZmMTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0LWl0ZW0gc3BhbiB7XG4gICAgICAgICAgICBjb2xvcjogI2UyZThmMDtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA1MDA7XG4gICAgICAgIH1cblxuICAgICAgICAuYWN0aW9ucyB7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgZ2FwOiA4cHg7XG4gICAgICAgIH1cblxuICAgICAgICAuYnRuLWljb24ge1xuICAgICAgICAgICAgZmxleDogMTtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAgICAgICBwYWRkaW5nOiAwLjZyZW07XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpO1xuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KTtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gICAgICAgICAgICBjb2xvcjogIzk0YTNiODtcbiAgICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICAgIHRyYW5zaXRpb246IGFsbCAwLjJzIGVhc2U7XG4gICAgICAgIH1cblxuICAgICAgICAuYnRuLWljb246aG92ZXIge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KTtcbiAgICAgICAgICAgIGNvbG9yOiAjZmZmO1xuICAgICAgICAgICAgYm9yZGVyLWNvbG9yOiByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSk7XG4gICAgICAgIH1cblxuICAgICAgICAuYnRuLWljb24ucmVzdGFydDpob3ZlciB7IGNvbG9yOiAjODE4Y2Y4OyBib3JkZXItY29sb3I6IHJnYmEoMTI5LCAxNDAsIDI0OCwgMC4zKTsgfVxuICAgICAgICAuYnRuLWljb24uc3RvcDpob3ZlciB7IGNvbG9yOiAjZjg3MTcxOyBib3JkZXItY29sb3I6IHJnYmEoMjQ4LCAxMTMsIDExMywgMC4zKTsgfVxuICAgICAgICAuYnRuLWljb24uc3RhcnQ6aG92ZXIgeyBjb2xvcjogIzM0ZDM5OTsgYm9yZGVyLWNvbG9yOiByZ2JhKDUyLCAyMTEsIDE1MywgMC4zKTsgfVxuXG4gICAgICAgIC5idG4taWNvbiBpIHtcbiAgICAgICAgICAgIHdpZHRoOiAxOHB4O1xuICAgICAgICAgICAgaGVpZ2h0OiAxOHB4O1xuICAgICAgICB9XG4gICAgYDtcblxuICAgIGZvcm1hdEJ5dGVzKGJ5dGVzKSB7XG4gICAgICAgIGlmICghYnl0ZXMpIHJldHVybiAnMCBCJztcbiAgICAgICAgY29uc3QgayA9IDEwMjQ7XG4gICAgICAgIGNvbnN0IGkgPSBNYXRoLmZsb29yKE1hdGgubG9nKGJ5dGVzKSAvIE1hdGgubG9nKGspKTtcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoKGJ5dGVzIC8gTWF0aC5wb3coaywgaSkpLnRvRml4ZWQoMSkpICsgJyAnICsgWydCJywgJ0tCJywgJ01CJywgJ0dCJ11baV07XG4gICAgfVxuXG4gICAgYXN5bmMgYWN0aW9uKHR5cGUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3YxL3Byb2Nlc3Nlcy8ke3RoaXMucHJvY2Vzcy5uYW1lfS8ke3R5cGV9YCwgeyBtZXRob2Q6ICdQT1NUJyB9KTtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICAgICAgaWYgKGRhdGEuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ3JlZnJlc2gtcmVxdWlyZWQnLCB7IGJ1YmJsZXM6IHRydWUsIGNvbXBvc2VkOiB0cnVlIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdBY3Rpb24gZmFpbGVkJywgZXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgcCA9IHRoaXMucHJvY2VzcztcbiAgICAgICAgcmV0dXJuIGh0bWxgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2FyZFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYXJkLWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaW5mb1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGg0PiR7cC5uYW1lfTwvaDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGlkXCI+UElEOiAke3AucGlkIHx8ICdOL0EnfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGF0dXMtYmFkZ2Ugc3RhdHVzLSR7cC5zdGF0ZX1cIj4ke3Auc3RhdGV9PC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXRzXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LWl0ZW1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPVwiYWN0aXZpdHlcIj48L2k+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj4ke3AuY3B1IHx8IDB9JTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0LWl0ZW1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxpIGRhdGEtbHVjaWRlPVwiZGF0YWJhc2VcIj48L2k+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj4ke3RoaXMuZm9ybWF0Qnl0ZXMocC5tZW1vcnkgfHwgMCl9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhY3Rpb25zXCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJidG4taWNvbiByZXN0YXJ0XCIgdGl0bGU9XCJSZXN0YXJ0XCIgQGNsaWNrPVwiJHsoKSA9PiB0aGlzLmFjdGlvbigncmVzdGFydCcpfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9XCJyZWZyZXNoLWNjd1wiPjwvaT5cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICR7cC5zdGF0ZSA9PT0gJ3J1bm5pbmcnIFxuICAgICAgICAgICAgICAgICAgICAgICAgPyBodG1sYDxidXR0b24gY2xhc3M9XCJidG4taWNvbiBzdG9wXCIgdGl0bGU9XCJTdG9wXCIgQGNsaWNrPVwiJHsoKSA9PiB0aGlzLmFjdGlvbignc3RvcCcpfVwiPjxpIGRhdGEtbHVjaWRlPVwic3F1YXJlXCI+PC9pPjwvYnV0dG9uPmBcbiAgICAgICAgICAgICAgICAgICAgICAgIDogaHRtbGA8YnV0dG9uIGNsYXNzPVwiYnRuLWljb24gc3RhcnRcIiB0aXRsZT1cIlN0YXJ0XCIgQGNsaWNrPVwiJHsoKSA9PiB0aGlzLmFjdGlvbignc3RhcnQnKX1cIj48aSBkYXRhLWx1Y2lkZT1cInBsYXlcIj48L2k+PC9idXR0b24+YFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJidG4taWNvblwiIHRpdGxlPVwiTG9nc1wiIEBjbGljaz1cIiR7KCkgPT4gdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgndmlldy1sb2dzJywgeyBkZXRhaWw6IHAubmFtZSwgYnViYmxlczogdHJ1ZSwgY29tcG9zZWQ6IHRydWUgfSkpfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9XCJmaWxlLXRleHRcIj48L2k+XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGA7XG4gICAgfVxuXG4gICAgdXBkYXRlZCgpIHtcbiAgICAgICAgaWYgKHdpbmRvdy5sdWNpZGUpIHtcbiAgICAgICAgICAgIHdpbmRvdy5sdWNpZGUuY3JlYXRlSWNvbnMoe1xuICAgICAgICAgICAgICAgIGF0dHJzOiB7ICdzdHJva2Utd2lkdGgnOiAyLCAnY2xhc3MnOiAnbHVjaWRlLWljb24nIH0sXG4gICAgICAgICAgICAgICAgcm9vdDogdGhpcy5zaGFkb3dSb290XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCd0c3BtLXByb2Nlc3MtY2FyZCcsIFRzcG1Qcm9jZXNzQ2FyZCk7XG4iLAogICAgImltcG9ydCB7IExpdEVsZW1lbnQsIGh0bWwsIGNzcyB9IGZyb20gJ2h0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vbGl0QDMuMS4yLytlc20nO1xuXG5leHBvcnQgY2xhc3MgVHNwbVByb2Nlc3NUYWJsZSBleHRlbmRzIExpdEVsZW1lbnQge1xuICAgIHN0YXRpYyBwcm9wZXJ0aWVzID0ge1xuICAgICAgICBwcm9jZXNzZXM6IHsgdHlwZTogQXJyYXkgfVxuICAgIH07XG5cbiAgICBzdGF0aWMgc3R5bGVzID0gY3NzYFxuICAgICAgICA6aG9zdCB7XG4gICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgfVxuXG4gICAgICAgIC50YWJsZS1jb250YWluZXIge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKTtcbiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSk7XG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiAyMHB4O1xuICAgICAgICAgICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRhYmxlIHtcbiAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTtcbiAgICAgICAgICAgIHRleHQtYWxpZ246IGxlZnQ7XG4gICAgICAgICAgICBmb250LXNpemU6IDAuOXJlbTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wMik7XG4gICAgICAgICAgICBwYWRkaW5nOiAxLjI1cmVtIDEuNXJlbTtcbiAgICAgICAgICAgIGNvbG9yOiAjOTRhM2I4O1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgICAgICAgICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGQge1xuICAgICAgICAgICAgcGFkZGluZzogMS4yNXJlbSAxLjVyZW07XG4gICAgICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKTtcbiAgICAgICAgICAgIGNvbG9yOiAjZTJlOGYwO1xuICAgICAgICB9XG5cbiAgICAgICAgdHI6bGFzdC1jaGlsZCB0ZCB7XG4gICAgICAgICAgICBib3JkZXItYm90dG9tOiBub25lO1xuICAgICAgICB9XG5cbiAgICAgICAgdHI6aG92ZXIgdGQge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5zdGF0dXMtYmFkZ2Uge1xuICAgICAgICAgICAgZm9udC1zaXplOiAwLjc1cmVtO1xuICAgICAgICAgICAgcGFkZGluZzogNHB4IDhweDtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICAgIH1cblxuICAgICAgICAuc3RhdHVzLXJ1bm5pbmcgeyBjb2xvcjogIzEwYjk4MTsgYmFja2dyb3VuZDogcmdiYSgxNiwgMTg1LCAxMjksIDAuMSk7IH1cbiAgICAgICAgLnN0YXR1cy1zdG9wcGVkIHsgY29sb3I6ICNlZjQ0NDQ7IGJhY2tncm91bmQ6IHJnYmEoMjM5LCA2OCwgNjgsIDAuMSk7IH1cblxuICAgICAgICAuZm9udC1tb25vIHtcbiAgICAgICAgICAgIGZvbnQtZmFtaWx5OiAnSmV0QnJhaW5zIE1vbm8nLCBtb25vc3BhY2U7XG4gICAgICAgICAgICBmb250LXNpemU6IDAuOHJlbTtcbiAgICAgICAgICAgIGNvbG9yOiAjOTRhM2I4O1xuICAgICAgICB9XG5cbiAgICAgICAgLmFjdGlvbnMge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLmJ0bi1pY29uIHtcbiAgICAgICAgICAgIHBhZGRpbmc6IDZweDtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICAgICAgICAgICAgYm9yZGVyOiBub25lO1xuICAgICAgICAgICAgY29sb3I6ICM2NDc0OGI7XG4gICAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiA2cHg7XG4gICAgICAgICAgICB0cmFuc2l0aW9uOiBhbGwgMC4ycztcbiAgICAgICAgfVxuXG4gICAgICAgIC5idG4taWNvbjpob3ZlciB7XG4gICAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSk7XG4gICAgICAgIH1cbiAgICBgO1xuXG4gICAgZm9ybWF0Qnl0ZXMoYnl0ZXMpIHtcbiAgICAgICAgaWYgKCFieXRlcykgcmV0dXJuICcwIEInO1xuICAgICAgICBjb25zdCBrID0gMTAyNDtcbiAgICAgICAgY29uc3QgaSA9IE1hdGguZmxvb3IoTWF0aC5sb2coYnl0ZXMpIC8gTWF0aC5sb2coaykpO1xuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCgoYnl0ZXMgLyBNYXRoLnBvdyhrLCBpKSkudG9GaXhlZCgxKSkgKyAnICcgKyBbJ0InLCAnS0InLCAnTUInLCAnR0InXVtpXTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiBodG1sYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRhYmxlLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgIDx0YWJsZT5cbiAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD5OYW1lPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+U3RhdHVzPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+UElEPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+TWVtb3J5PC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+Q1BVPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+VXB0aW1lPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+QWN0aW9uczwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAke3RoaXMucHJvY2Vzc2VzLm1hcChwID0+IGh0bWxgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJmb250LXdlaWdodDogNjAwO1wiPiR7cC5uYW1lfTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD48c3BhbiBjbGFzcz1cInN0YXR1cy1iYWRnZSBzdGF0dXMtJHtwLnN0YXRlfVwiPiR7cC5zdGF0ZX08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiZm9udC1tb25vXCI+IyR7cC5waWQgfHwgJy0nfTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD4ke3RoaXMuZm9ybWF0Qnl0ZXMocC5tZW1vcnkgfHwgMCl9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPiR7cC5jcHUgfHwgMH0lPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkPiR7dGhpcy5mb3JtYXRVcHRpbWUocC51cHRpbWUpfTwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhY3Rpb25zXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0bi1pY29uXCIgQGNsaWNrPVwiJHsoKSA9PiB0aGlzLl9hY3Rpb24ocC5uYW1lLCAncmVzdGFydCcpfVwiPjxpIGRhdGEtbHVjaWRlPVwicmVmcmVzaC1jY3dcIiBzdHlsZT1cIndpZHRoOjE2cHhcIj48L2k+PC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0bi1pY29uXCIgQGNsaWNrPVwiJHsoKSA9PiB0aGlzLl9hY3Rpb24ocC5uYW1lLCBwLnN0YXRlID09PSAncnVubmluZycgPyAnc3RvcCcgOiAnc3RhcnQnKX1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9XCIke3Auc3RhdGUgPT09ICdydW5uaW5nJyA/ICdzcXVhcmUnIDogJ3BsYXknfVwiIHN0eWxlPVwid2lkdGg6MTZweFwiPjwvaT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgICBgKX1cbiAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICA8L3RhYmxlPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGA7XG4gICAgfVxuXG4gICAgZm9ybWF0VXB0aW1lKG1zKSB7XG4gICAgICAgIGlmICghbXMpIHJldHVybiAnLSc7XG4gICAgICAgIGNvbnN0IHMgPSBNYXRoLmZsb29yKG1zIC8gMTAwMCk7XG4gICAgICAgIGNvbnN0IG0gPSBNYXRoLmZsb29yKHMgLyA2MCk7XG4gICAgICAgIGNvbnN0IGggPSBNYXRoLmZsb29yKG0gLyA2MCk7XG4gICAgICAgIHJldHVybiBgJHtofWggJHttICUgNjB9bWA7XG4gICAgfVxuXG4gICAgYXN5bmMgX2FjdGlvbihuYW1lLCBhY3Rpb24pIHtcbiAgICAgICAgYXdhaXQgZmV0Y2goYC9hcGkvdjEvcHJvY2Vzc2VzLyR7bmFtZX0vJHthY3Rpb259YCwgeyBtZXRob2Q6ICdQT1NUJyB9KTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgncmVmcmVzaC1yZXF1aXJlZCcsIHsgYnViYmxlczogdHJ1ZSwgY29tcG9zZWQ6IHRydWUgfSkpO1xuICAgIH1cblxuICAgIHVwZGF0ZWQoKSB7XG4gICAgICAgIGlmICh3aW5kb3cubHVjaWRlKSB7XG4gICAgICAgICAgICB3aW5kb3cubHVjaWRlLmNyZWF0ZUljb25zKHtcbiAgICAgICAgICAgICAgICBhdHRyczogeyAnc3Ryb2tlLXdpZHRoJzogMiwgJ2NsYXNzJzogJ2x1Y2lkZS1pY29uJyB9LFxuICAgICAgICAgICAgICAgIHJvb3Q6IHRoaXMuc2hhZG93Um9vdFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmN1c3RvbUVsZW1lbnRzLmRlZmluZSgndHNwbS1wcm9jZXNzLXRhYmxlJywgVHNwbVByb2Nlc3NUYWJsZSk7XG4iLAogICAgImltcG9ydCB7IExpdEVsZW1lbnQsIGh0bWwsIGNzcyB9IGZyb20gJ2h0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vbGl0QDMuMS4yLytlc20nO1xuXG5leHBvcnQgY2xhc3MgVHNwbVRlcm1pbmFsIGV4dGVuZHMgTGl0RWxlbWVudCB7XG4gICAgc3RhdGljIHByb3BlcnRpZXMgPSB7XG4gICAgICAgIGFjdGl2ZTogeyB0eXBlOiBCb29sZWFuIH0sXG4gICAgICAgIGhpc3Rvcnk6IHsgdHlwZTogQXJyYXkgfVxuICAgIH07XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5oaXN0b3J5ID0gW107XG4gICAgICAgIHRoaXMuX3NldHVwTGlzdGVuZXJzKCk7XG4gICAgfVxuXG4gICAgX3NldHVwTGlzdGVuZXJzKCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndGVybWluYWwtb3V0JywgKGUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGlzdG9yeSA9IFsuLi50aGlzLmhpc3RvcnksIHsgdGV4dDogZS5kZXRhaWwsIHR5cGU6ICdvdXRwdXQnIH1dO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RhdGljIHN0eWxlcyA9IGNzc2BcbiAgICAgICAgOmhvc3Qge1xuICAgICAgICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgIH1cblxuICAgICAgICAudGVybWluYWwge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogIzAwMDtcbiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgICAgICAgICBoZWlnaHQ6IDYwMHB4O1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICAgICAgYm94LXNoYWRvdzogMCAyMHB4IDUwcHggcmdiYSgwLDAsMCwwLjUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLmhlYWRlciB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjMWExYTFhO1xuICAgICAgICAgICAgcGFkZGluZzogOHB4IDE2cHg7XG4gICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgIGdhcDogMTJweDtcbiAgICAgICAgICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjMzMzO1xuICAgICAgICB9XG5cbiAgICAgICAgLmRvdHMgeyBkaXNwbGF5OiBmbGV4OyBnYXA6IDZweDsgfVxuICAgICAgICAuZG90IHsgd2lkdGg6IDEwcHg7IGhlaWdodDogMTBweDsgYm9yZGVyLXJhZGl1czogNTAlOyB9XG4gICAgICAgIC5kb3QucmVkIHsgYmFja2dyb3VuZDogI2ZmNWY1NjsgfVxuICAgICAgICAuZG90LnllbGxvdyB7IGJhY2tncm91bmQ6ICNmZmJkMmU7IH1cbiAgICAgICAgLmRvdC5ncmVlbiB7IGJhY2tncm91bmQ6ICMyN2M5M2Y7IH1cblxuICAgICAgICAudGl0bGUgeyBjb2xvcjogIzg4ODsgZm9udC1zaXplOiAwLjc1cmVtOyBmb250LWZhbWlseTogJ0pldEJyYWlucyBNb25vJywgbW9ub3NwYWNlOyB9XG5cbiAgICAgICAgLm91dHB1dCB7XG4gICAgICAgICAgICBmbGV4OiAxO1xuICAgICAgICAgICAgcGFkZGluZzogMXJlbTtcbiAgICAgICAgICAgIG92ZXJmbG93LXk6IGF1dG87XG4gICAgICAgICAgICBmb250LWZhbWlseTogJ0pldEJyYWlucyBNb25vJywgbW9ub3NwYWNlO1xuICAgICAgICAgICAgZm9udC1zaXplOiAwLjlyZW07XG4gICAgICAgICAgICBjb2xvcjogI2QxZDVkYjtcbiAgICAgICAgICAgIGxpbmUtaGVpZ2h0OiAxLjU7XG4gICAgICAgICAgICB3aGl0ZS1zcGFjZTogcHJlLXdyYXA7XG4gICAgICAgICAgICBzY3JvbGxiYXItd2lkdGg6IHRoaW47XG4gICAgICAgIH1cblxuICAgICAgICAub3V0cHV0Ojotd2Via2l0LXNjcm9sbGJhciB7IHdpZHRoOiA2cHg7IH1cbiAgICAgICAgLm91dHB1dDo6LXdlYmtpdC1zY3JvbGxiYXItdGh1bWIgeyBiYWNrZ3JvdW5kOiAjMzMzOyB9XG5cbiAgICAgICAgLmxpbmUgeyBtYXJnaW4tYm90dG9tOiA0cHg7IH1cbiAgICAgICAgLmxpbmUuaW5wdXQgeyBjb2xvcjogIzgxOGNmODsgZm9udC13ZWlnaHQ6IGJvbGQ7IH1cbiAgICAgICAgLmxpbmUuZXJyb3IgeyBjb2xvcjogI2Y4NzE3MTsgfVxuXG4gICAgICAgIC5pbnB1dC1hcmVhIHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgICAgcGFkZGluZzogMC43NXJlbSAxcmVtO1xuICAgICAgICAgICAgYmFja2dyb3VuZDogIzAwMDtcbiAgICAgICAgICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCAjMWExYTFhO1xuICAgICAgICB9XG5cbiAgICAgICAgLnByb21wdCB7IGNvbG9yOiAjMTBiOTgxOyBtYXJnaW4tcmlnaHQ6IDEycHg7IGZvbnQtd2VpZ2h0OiBib2xkOyB9XG5cbiAgICAgICAgaW5wdXQge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICAgIG91dGxpbmU6IG5vbmU7XG4gICAgICAgICAgICBmbGV4OiAxO1xuICAgICAgICAgICAgZm9udC1mYW1pbHk6IGluaGVyaXQ7XG4gICAgICAgICAgICBmb250LXNpemU6IGluaGVyaXQ7XG4gICAgICAgIH1cbiAgICBgO1xuXG4gICAgYXN5bmMgX2hhbmRsZUtleShlKSB7XG4gICAgICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJykge1xuICAgICAgICAgICAgY29uc3QgY21kID0gZS50YXJnZXQudmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgaWYgKCFjbWQpIHJldHVybjtcblxuICAgICAgICAgICAgdGhpcy5oaXN0b3J5ID0gWy4uLnRoaXMuaGlzdG9yeSwgeyB0ZXh0OiBjbWQsIHR5cGU6ICdpbnB1dCcgfV07XG4gICAgICAgICAgICBlLnRhcmdldC52YWx1ZSA9ICcnO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3YxL2V4ZWN1dGUnLCB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBjb21tYW5kOiBjbWQgfSlcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5vdXRwdXQpIHRoaXMuaGlzdG9yeSA9IFsuLi50aGlzLmhpc3RvcnksIHsgdGV4dDogZGF0YS5vdXRwdXQsIHR5cGU6ICdvdXRwdXQnIH1dO1xuICAgICAgICAgICAgICAgIGlmIChkYXRhLmVycm9yKSB0aGlzLmhpc3RvcnkgPSBbLi4udGhpcy5oaXN0b3J5LCB7IHRleHQ6IGRhdGEuZXJyb3IsIHR5cGU6ICdlcnJvcicgfV07XG4gICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHRoaXMuaGlzdG9yeSA9IFsuLi50aGlzLmhpc3RvcnksIHsgdGV4dDogJ0V4ZWN1dGlvbiBmYWlsZWQnLCB0eXBlOiAnZXJyb3InIH1dO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3Njcm9sbFRvQm90dG9tKCkge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG91dCA9IHRoaXMuc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yKCcub3V0cHV0Jyk7XG4gICAgICAgICAgICBpZiAob3V0KSBvdXQuc2Nyb2xsVG9wID0gb3V0LnNjcm9sbEhlaWdodDtcbiAgICAgICAgfSwgMCk7XG4gICAgfVxuXG4gICAgdXBkYXRlZChjaGFuZ2VkKSB7XG4gICAgICAgIGlmIChjaGFuZ2VkLmhhcygnYWN0aXZlJykgJiYgdGhpcy5hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpPy5mb2N1cygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gaHRtbGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0ZXJtaW5hbFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImRvdHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJkb3QgcmVkXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZG90IHllbGxvd1wiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImRvdCBncmVlblwiPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRpdGxlXCI+VFNQTSBTSEVMTCDigJQgQlVOPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm91dHB1dFwiPlxuICAgICAgICAgICAgICAgICAgICAke3RoaXMuaGlzdG9yeS5tYXAobGluZSA9PiBodG1sYFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImxpbmUgJHtsaW5lLnR5cGV9XCI+JHtsaW5lLnR5cGUgPT09ICdpbnB1dCcgPyAnJCAnIDogJyd9JHtsaW5lLnRleHR9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIGApfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJpbnB1dC1hcmVhXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwicHJvbXB0XCI+4p6cPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIlR5cGUgYSBjb21tYW5kLi4uXCIgQGtleWRvd249XCIke3RoaXMuX2hhbmRsZUtleX1cIiAvPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGA7XG4gICAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ3RzcG0tdGVybWluYWwnLCBUc3BtVGVybWluYWwpO1xuIiwKICAgICJpbXBvcnQgeyBMaXRFbGVtZW50LCBodG1sLCBjc3MgfSBmcm9tICdodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvbnBtL2xpdEAzLjEuMi8rZXNtJztcblxuZXhwb3J0IGNsYXNzIFRzcG1Mb2dzIGV4dGVuZHMgTGl0RWxlbWVudCB7XG4gICAgc3RhdGljIHByb3BlcnRpZXMgPSB7XG4gICAgICAgIHByb2Nlc3NlczogeyB0eXBlOiBBcnJheSB9LFxuICAgICAgICBzZWxlY3RlZFByb2Nlc3M6IHsgdHlwZTogU3RyaW5nIH0sXG4gICAgICAgIGxvZ3M6IHsgdHlwZTogQXJyYXkgfVxuICAgIH07XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5sb2dzID0gW107XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRQcm9jZXNzID0gJ2FsbCc7XG4gICAgICAgIHRoaXMuX3NldHVwTGlzdGVuZXJzKCk7XG4gICAgfVxuXG4gICAgX3NldHVwTGlzdGVuZXJzKCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbmV3LWxvZycsIChlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZ3MgPSBbLi4udGhpcy5sb2dzLnNsaWNlKC05OTkpLCBlLmRldGFpbF07XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGxUb0JvdHRvbSgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgc3R5bGVzID0gY3NzYFxuICAgICAgICA6aG9zdCB7XG4gICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5jb250YWluZXIge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgxNSwgMTUsIDIwLCAwLjYpO1xuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KTtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDE2cHg7XG4gICAgICAgICAgICBoZWlnaHQ6IDYwMHB4O1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICB9XG5cbiAgICAgICAgLmhlYWRlciB7XG4gICAgICAgICAgICBwYWRkaW5nOiAxcmVtO1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAyKTtcbiAgICAgICAgICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpO1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxlY3Qge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogIzFhMWExYTtcbiAgICAgICAgICAgIGNvbG9yOiAjZmZmO1xuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgIzMzMztcbiAgICAgICAgICAgIHBhZGRpbmc6IDZweCAxMnB4O1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogOHB4O1xuICAgICAgICAgICAgZm9udC1mYW1pbHk6IGluaGVyaXQ7XG4gICAgICAgIH1cblxuICAgICAgICAub3V0cHV0IHtcbiAgICAgICAgICAgIGZsZXg6IDE7XG4gICAgICAgICAgICBwYWRkaW5nOiAxcmVtO1xuICAgICAgICAgICAgb3ZlcmZsb3cteTogYXV0bztcbiAgICAgICAgICAgIGZvbnQtZmFtaWx5OiAnSmV0QnJhaW5zIE1vbm8nLCBtb25vc3BhY2U7XG4gICAgICAgICAgICBmb250LXNpemU6IDAuODVyZW07XG4gICAgICAgICAgICBzY3JvbGxiYXItd2lkdGg6IHRoaW47XG4gICAgICAgIH1cblxuICAgICAgICAub3V0cHV0Ojotd2Via2l0LXNjcm9sbGJhciB7IHdpZHRoOiA2cHg7IH1cbiAgICAgICAgLm91dHB1dDo6LXdlYmtpdC1zY3JvbGxiYXItdGh1bWIgeyBiYWNrZ3JvdW5kOiAjMzMzOyB9XG5cbiAgICAgICAgLmxpbmUge1xuICAgICAgICAgICAgbWFyZ2luLWJvdHRvbTogNHB4O1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGdhcDogMTJweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC50aW1lc3RhbXAgeyBjb2xvcjogIzY0NzQ4YjsgbWluLXdpZHRoOiA4MHB4OyB9XG4gICAgICAgIC5wcm9jIHsgY29sb3I6ICM4MThjZjg7IGZvbnQtd2VpZ2h0OiA2MDA7IG1pbi13aWR0aDogMTAwcHg7IH1cbiAgICAgICAgLm1zZyB7IGNvbG9yOiAjZTJlOGYwOyB3aGl0ZS1zcGFjZTogcHJlLXdyYXA7IHdvcmQtYnJlYWs6IGJyZWFrLWFsbDsgfVxuXG4gICAgICAgIC5jb250cm9scyB7IGRpc3BsYXk6IGZsZXg7IGdhcDogMTBweDsgfVxuICAgICAgICAuYnRuLWljb24ge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgICAgICBjb2xvcjogIzY0NzQ4YjtcbiAgICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICAgIHBhZGRpbmc6IDRweDtcbiAgICAgICAgfVxuICAgICAgICAuYnRuLWljb246aG92ZXIgeyBjb2xvcjogI2ZmZjsgfVxuICAgIGA7XG5cbiAgICBfc2Nyb2xsVG9Cb3R0b20oKSB7XG4gICAgICAgIGNvbnN0IG91dCA9IHRoaXMuc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yKCcub3V0cHV0Jyk7XG4gICAgICAgIGlmIChvdXQpIG91dC5zY3JvbGxUb3AgPSBvdXQuc2Nyb2xsSGVpZ2h0O1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgY29uc3QgZmlsdGVyZWRMb2dzID0gdGhpcy5zZWxlY3RlZFByb2Nlc3MgPT09ICdhbGwnIFxuICAgICAgICAgICAgPyB0aGlzLmxvZ3MgXG4gICAgICAgICAgICA6IHRoaXMubG9ncy5maWx0ZXIobCA9PiBsLnByb2Nlc3NOYW1lID09PSB0aGlzLnNlbGVjdGVkUHJvY2Vzcyk7XG5cbiAgICAgICAgcmV0dXJuIGh0bWxgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IEBjaGFuZ2U9XCIkeyhlKSA9PiB0aGlzLnNlbGVjdGVkUHJvY2VzcyA9IGUudGFyZ2V0LnZhbHVlfVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImFsbFwiPkdsb2JhbCBMb2dzPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAke3RoaXMucHJvY2Vzc2VzLm1hcChwID0+IGh0bWxgPG9wdGlvbiB2YWx1ZT1cIiR7cC5uYW1lfVwiID9zZWxlY3RlZD1cIiR7dGhpcy5zZWxlY3RlZFByb2Nlc3MgPT09IHAubmFtZX1cIj4ke3AubmFtZX08L29wdGlvbj5gKX1cbiAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0bi1pY29uXCIgdGl0bGU9XCJDbGVhclwiIEBjbGljaz1cIiR7KCkgPT4gdGhpcy5sb2dzID0gW119XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGkgZGF0YS1sdWNpZGU9XCJ0cmFzaC0yXCI+PC9pPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJvdXRwdXRcIj5cbiAgICAgICAgICAgICAgICAgICAgJHtmaWx0ZXJlZExvZ3MubWFwKGxvZyA9PiBodG1sYFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImxpbmVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInRpbWVzdGFtcFwiPlske25ldyBEYXRlKCkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9XTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInByb2NcIj5bJHtsb2cucHJvY2Vzc05hbWV9XTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cIm1zZ1wiPiR7bG9nLm1lc3NhZ2V9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIGApfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGA7XG4gICAgfVxuXG4gICAgdXBkYXRlZCgpIHtcbiAgICAgICAgaWYgKHdpbmRvdy5sdWNpZGUpIHtcbiAgICAgICAgICAgIHdpbmRvdy5sdWNpZGUuY3JlYXRlSWNvbnMoe1xuICAgICAgICAgICAgICAgIGF0dHJzOiB7ICdzdHJva2Utd2lkdGgnOiAyLCAnY2xhc3MnOiAnbHVjaWRlLWljb24nIH0sXG4gICAgICAgICAgICAgICAgcm9vdDogdGhpcy5zaGFkb3dSb290XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCd0c3BtLWxvZ3MnLCBUc3BtTG9ncyk7XG4iLAogICAgImltcG9ydCB7IExpdEVsZW1lbnQsIGh0bWwsIGNzcyB9IGZyb20gJ2h0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vbGl0QDMuMS4yLytlc20nO1xuXG5leHBvcnQgY2xhc3MgVHNwbU1vZGFsIGV4dGVuZHMgTGl0RWxlbWVudCB7XG4gICAgc3RhdGljIHByb3BlcnRpZXMgPSB7XG4gICAgICAgIGlzT3BlbjogeyB0eXBlOiBCb29sZWFuIH1cbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG4gICAgfVxuXG4gICAgb3BlbigpIHsgdGhpcy5pc09wZW4gPSB0cnVlOyB9XG4gICAgY2xvc2UoKSB7IHRoaXMuaXNPcGVuID0gZmFsc2U7IH1cblxuICAgIHN0YXRpYyBzdHlsZXMgPSBjc3NgXG4gICAgICAgIDpob3N0IHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGNvbnRlbnRzO1xuICAgICAgICB9XG5cbiAgICAgICAgLm92ZXJsYXkge1xuICAgICAgICAgICAgcG9zaXRpb246IGZpeGVkO1xuICAgICAgICAgICAgdG9wOiAwO1xuICAgICAgICAgICAgbGVmdDogMDtcbiAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgwLCAwLCAwLCAwLjgpO1xuICAgICAgICAgICAgYmFja2Ryb3AtZmlsdGVyOiBibHVyKDhweCk7XG4gICAgICAgICAgICB6LWluZGV4OiAxMDAwO1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICAgIG9wYWNpdHk6IDA7XG4gICAgICAgICAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICAgICAgICAgIHRyYW5zaXRpb246IG9wYWNpdHkgMC4zcyBlYXNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLm92ZXJsYXkuYWN0aXZlIHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDE7XG4gICAgICAgICAgICBwb2ludGVyLWV2ZW50czogYXV0bztcbiAgICAgICAgfVxuXG4gICAgICAgIC5tb2RhbCB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjMWExYTFlO1xuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpO1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMjRweDtcbiAgICAgICAgICAgIHdpZHRoOiA1MDBweDtcbiAgICAgICAgICAgIG1heC13aWR0aDogOTAlO1xuICAgICAgICAgICAgcGFkZGluZzogMnJlbTtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMC45KTtcbiAgICAgICAgICAgIHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjNzIGN1YmljLWJlemllcigwLjM0LCAxLjU2LCAwLjY0LCAxKTtcbiAgICAgICAgICAgIGJveC1zaGFkb3c6IDAgMjVweCA1MHB4IC0xMnB4IHJnYmEoMCwgMCwgMCwgMC41KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5hY3RpdmUgLm1vZGFsIHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMSk7XG4gICAgICAgIH1cblxuICAgICAgICBoZWFkZXIge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAycmVtO1xuICAgICAgICB9XG5cbiAgICAgICAgaGVhZGVyIGgyIHsgbWFyZ2luOiAwOyBmb250LXNpemU6IDEuNXJlbTsgY29sb3I6ICNmZmY7IH1cblxuICAgICAgICAuYnRuLWNsb3NlIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IG5vbmU7XG4gICAgICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgICAgICBjb2xvcjogIzY0NzQ4YjtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMS41cmVtO1xuICAgICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9ybSB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGdhcDogMS41cmVtOyB9XG5cbiAgICAgICAgLmZvcm0tZ3JvdXAgeyBkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uOyBnYXA6IDhweDsgfVxuICAgICAgICBsYWJlbCB7IGNvbG9yOiAjOTRhM2I4OyBmb250LXNpemU6IDAuOXJlbTsgZm9udC13ZWlnaHQ6IDUwMDsgfVxuXG4gICAgICAgIGlucHV0LCBzZWxlY3Qge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKTtcbiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKTtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDEycHg7XG4gICAgICAgICAgICBwYWRkaW5nOiAwLjc1cmVtIDFyZW07XG4gICAgICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgICAgIGZvbnQtZmFtaWx5OiBpbmhlcml0O1xuICAgICAgICB9XG5cbiAgICAgICAgaW5wdXQ6Zm9jdXMgeyBib3JkZXItY29sb3I6ICM2MzY2ZjE7IG91dGxpbmU6IG5vbmU7IH1cblxuICAgICAgICAucm93IHsgZGlzcGxheTogZ3JpZDsgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAxZnIgMWZyOyBnYXA6IDFyZW07IH1cblxuICAgICAgICBmb290ZXIge1xuICAgICAgICAgICAgbWFyZ2luLXRvcDogMi41cmVtO1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gICAgICAgICAgICBnYXA6IDEycHg7XG4gICAgICAgIH1cblxuICAgICAgICAuYnRuIHtcbiAgICAgICAgICAgIHBhZGRpbmc6IDAuNzVyZW0gMS41cmVtO1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMTJweDtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgICB0cmFuc2l0aW9uOiBhbGwgMC4ycztcbiAgICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5idG4tY2FuY2VsIHsgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7IGNvbG9yOiAjOTRhM2I4OyB9XG4gICAgICAgIC5idG4tcHJpbWFyeSB7IGJhY2tncm91bmQ6ICM2MzY2ZjE7IGNvbG9yOiB3aGl0ZTsgfVxuICAgICAgICAuYnRuLXByaW1hcnk6aG92ZXIgeyBiYWNrZ3JvdW5kOiAjNGY0NmU1OyB9XG4gICAgYDtcblxuICAgIGFzeW5jIF9oYW5kbGVTdWJtaXQoZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKGUudGFyZ2V0KTtcbiAgICAgICAgY29uc3QgY29uZmlnID0gT2JqZWN0LmZyb21FbnRyaWVzKGZvcm1EYXRhLmVudHJpZXMoKSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAvYXBpL3YxL3Byb2Nlc3Nlc2AsIHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShjb25maWcpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xuICAgICAgICAgICAgaWYgKGRhdGEuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCdwcm9jZXNzLWFkZGVkJywgeyBidWJibGVzOiB0cnVlLCBjb21wb3NlZDogdHJ1ZSB9KSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFsZXJ0KGRhdGEuZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGFsZXJ0KCdGYWlsZWQgdG8gc3Bhd24gcHJvY2VzcycpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gaHRtbGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJvdmVybGF5ICR7dGhpcy5pc09wZW4gPyAnYWN0aXZlJyA6ICcnfVwiIEBjbGljaz1cIiR7KGUpID0+IGUudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnb3ZlcmxheScpICYmIHRoaXMuY2xvc2UoKX1cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibW9kYWxcIj5cbiAgICAgICAgICAgICAgICAgICAgPGhlYWRlcj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMj5Qcm9jZXNzIENvbmZpZ3VyYXRpb248L2gyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImJ0bi1jbG9zZVwiIEBjbGljaz1cIiR7dGhpcy5jbG9zZX1cIj4mdGltZXM7PC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvaGVhZGVyPlxuICAgICAgICAgICAgICAgICAgICA8Zm9ybSBAc3VibWl0PVwiJHt0aGlzLl9oYW5kbGVTdWJtaXR9XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9ybS1ncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbD5OYW1lPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBuYW1lPVwibmFtZVwiIHBsYWNlaG9sZGVyPVwibXktYXdlc29tZS1hcGlcIiByZXF1aXJlZCAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicm93XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZvcm0tZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsPlNjcmlwdCBQYXRoPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgbmFtZT1cInNjcmlwdFwiIHBsYWNlaG9sZGVyPVwiLi9zcmMvaW5kZXgudHNcIiByZXF1aXJlZCAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmb3JtLWdyb3VwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbD5JbnRlcnByZXRlcjwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgbmFtZT1cImludGVycHJldGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiYnVuXCI+QnVuPC9vcHRpb24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwibm9kZVwiPk5vZGU8L29wdGlvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJyb3dcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZm9ybS1ncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWw+SW5zdGFuY2VzPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJudW1iZXJcIiBuYW1lPVwiaW5zdGFuY2VzXCIgdmFsdWU9XCIxXCIgbWluPVwiMVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZvcm0tZ3JvdXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsPk5hbWVzcGFjZTwvbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIG5hbWU9XCJuYW1lc3BhY2VcIiBwbGFjZWhvbGRlcj1cInByb2R1Y3Rpb25cIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Zm9vdGVyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi1jYW5jZWxcIiBAY2xpY2s9XCIke3RoaXMuY2xvc2V9XCI+Q2FuY2VsPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwic3VibWl0XCIgY2xhc3M9XCJidG4gYnRuLXByaW1hcnlcIj5TcGF3biBJbnN0YW5jZTwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9mb290ZXI+XG4gICAgICAgICAgICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgO1xuICAgIH1cbn1cblxuY3VzdG9tRWxlbWVudHMuZGVmaW5lKCd0c3BtLW1vZGFsJywgVHNwbU1vZGFsKTtcbiIsCiAgICAiaW1wb3J0IHsgTGl0RWxlbWVudCwgaHRtbCwgY3NzIH0gZnJvbSAnaHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L25wbS9saXRAMy4xLjIvK2VzbSc7XG5cbmV4cG9ydCBjbGFzcyBUc3BtQXBwIGV4dGVuZHMgTGl0RWxlbWVudCB7XG4gICAgc3RhdGljIHByb3BlcnRpZXMgPSB7XG4gICAgICAgIGN1cnJlbnRWaWV3OiB7IHR5cGU6IFN0cmluZyB9LFxuICAgICAgICBwcm9jZXNzZXM6IHsgdHlwZTogQXJyYXkgfSxcbiAgICAgICAgc3lzdGVtU3RhdHM6IHsgdHlwZTogT2JqZWN0IH0sXG4gICAgICAgIHNvY2tldDogeyB0eXBlOiBPYmplY3QgfSxcbiAgICAgICAgaXNPbmxpbmU6IHsgdHlwZTogQm9vbGVhbiB9XG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmN1cnJlbnRWaWV3ID0gJ2Rhc2hib2FyZCc7XG4gICAgICAgIHRoaXMucHJvY2Vzc2VzID0gW107XG4gICAgICAgIHRoaXMuc3lzdGVtU3RhdHMgPSB7IGNwdTogMCwgbWVtb3J5OiAwLCB1cHRpbWU6IDAgfTtcbiAgICAgICAgdGhpcy5pc09ubGluZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNvbm5lY3QoKTtcblxuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3ZpZXctbG9ncycsIChlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRWaWV3ID0gJ2xvZ3MnO1xuICAgICAgICAgICAgLy8gV2FpdCBmb3IgdXBkYXRlIHRoZW4gc2V0IHRoZSBzZWxlY3RlZCBwcm9jZXNzXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbXBsZXRlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGxvZ3NDb21wID0gdGhpcy5zaGFkb3dSb290LnF1ZXJ5U2VsZWN0b3IoJ3RzcG0tbG9ncycpO1xuICAgICAgICAgICAgICAgIGlmIChsb2dzQ29tcCkgbG9nc0NvbXAuc2VsZWN0ZWRQcm9jZXNzID0gZS5kZXRhaWw7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKCdyZWZyZXNoLXJlcXVpcmVkJywgKCkgPT4gdGhpcy5mZXRjaERhdGEoKSk7XG4gICAgfVxuXG4gICAgY29ubmVjdCgpIHtcbiAgICAgICAgY29uc3QgcHJvdG9jb2wgPSB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgPT09ICdodHRwczonID8gJ3dzczonIDogJ3dzOic7XG4gICAgICAgIGNvbnN0IGhvc3QgPSB3aW5kb3cubG9jYXRpb24uaG9zdDtcbiAgICAgICAgdGhpcy5zb2NrZXQgPSBuZXcgV2ViU29ja2V0KGAke3Byb3RvY29sfS8vJHtob3N0fS93c2ApO1xuXG4gICAgICAgIHRoaXMuc29ja2V0Lm9ub3BlbiA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDb25uZWN0ZWQgdG8gVFNQTSBOb2RlJyk7XG4gICAgICAgICAgICB0aGlzLmlzT25saW5lID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuZmV0Y2hEYXRhKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zb2NrZXQub25tZXNzYWdlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlVXBkYXRlKGRhdGEpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc29ja2V0Lm9uY2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnRGlzY29ubmVjdGVkIGZyb20gVFNQTSBOb2RlJyk7XG4gICAgICAgICAgICB0aGlzLmlzT25saW5lID0gZmFsc2U7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuY29ubmVjdCgpLCAzMDAwKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBoYW5kbGVVcGRhdGUoZGF0YSkge1xuICAgICAgICBzd2l0Y2ggKGRhdGEudHlwZSkge1xuICAgICAgICAgICAgY2FzZSAncHJvY2Vzczp1cGRhdGUnOlxuICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc2VzID0gZGF0YS5wYXlsb2FkO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncHJvY2Vzczpsb2cnOlxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ25ldy1sb2cnLCB7IGRldGFpbDogZGF0YS5wYXlsb2FkLCBidWJibGVzOiB0cnVlLCBjb21wb3NlZDogdHJ1ZSB9KSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd0ZXJtaW5hbDpvdXQnOlxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ3Rlcm1pbmFsLW91dCcsIHsgZGV0YWlsOiBkYXRhLnBheWxvYWQsIGJ1YmJsZXM6IHRydWUsIGNvbXBvc2VkOiB0cnVlIH0pKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3N5c3RlbTpzdGF0cyc6XG4gICAgICAgICAgICAgICAgdGhpcy5zeXN0ZW1TdGF0cyA9IGRhdGEucGF5bG9hZDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRGF0YSgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKCcvYXBpL3YxL3N0YXR1cycpO1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgICAgICAgICBpZiAoZGF0YS5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzZXMgPSBkYXRhLmRhdGEucHJvY2Vzc2VzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBmZXRjaCBkYXRhJywgZXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBzdHlsZXMgPSBjc3NgXG4gICAgICAgIDpob3N0IHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGdyaWQ7XG4gICAgICAgICAgICBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDI2MHB4IDFmcjtcbiAgICAgICAgICAgIGhlaWdodDogMTAwdmg7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjMGEwYTBjO1xuICAgICAgICAgICAgY29sb3I6ICNlMmU4ZjA7XG4gICAgICAgICAgICBmb250LWZhbWlseTogJ091dGZpdCcsIHNhbnMtc2VyaWY7XG4gICAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICB9XG5cbiAgICAgICAgQG1lZGlhIChtYXgtd2lkdGg6IDc2OHB4KSB7XG4gICAgICAgICAgICA6aG9zdCB7XG4gICAgICAgICAgICAgICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiA4MHB4IDFmcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC5tYWluLWNvbnRlbnQge1xuICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICAgICAgYmFja2dyb3VuZDogcmFkaWFsLWdyYWRpZW50KGNpcmNsZSBhdCB0b3AgcmlnaHQsICMxYTFhMmUgMCUsICMwYTBhMGMgMTAwJSk7XG4gICAgICAgIH1cblxuICAgICAgICAudmlldy1jb250YWluZXIge1xuICAgICAgICAgICAgZmxleDogMTtcbiAgICAgICAgICAgIHBhZGRpbmc6IDJyZW07XG4gICAgICAgICAgICBvdmVyZmxvdy15OiBhdXRvO1xuICAgICAgICAgICAgc2Nyb2xsYmFyLXdpZHRoOiB0aGluO1xuICAgICAgICAgICAgc2Nyb2xsYmFyLWNvbG9yOiAjMzM0MTU1IHRyYW5zcGFyZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgLnZpZXctY29udGFpbmVyOjotd2Via2l0LXNjcm9sbGJhciB7XG4gICAgICAgICAgICB3aWR0aDogNnB4O1xuICAgICAgICB9XG5cbiAgICAgICAgLnZpZXctY29udGFpbmVyOjotd2Via2l0LXNjcm9sbGJhci10aHVtYiB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzM0MTU1O1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC52aWV3IHtcbiAgICAgICAgICAgIGRpc3BsYXk6IG5vbmU7XG4gICAgICAgICAgICBhbmltYXRpb246IGZhZGVJbiAwLjRzIGVhc2Utb3V0O1xuICAgICAgICB9XG5cbiAgICAgICAgLnZpZXcuYWN0aXZlIHtcbiAgICAgICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgICAgICB9XG5cbiAgICAgICAgQGtleWZyYW1lcyBmYWRlSW4ge1xuICAgICAgICAgICAgZnJvbSB7IG9wYWNpdHk6IDA7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSgxMHB4KTsgfVxuICAgICAgICAgICAgdG8geyBvcGFjaXR5OiAxOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMCk7IH1cbiAgICAgICAgfVxuICAgIGA7XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiBodG1sYFxuICAgICAgICAgICAgPHRzcG0tc2lkZWJhciBcbiAgICAgICAgICAgICAgICAuY3VycmVudFZpZXc9XCIke3RoaXMuY3VycmVudFZpZXd9XCIgXG4gICAgICAgICAgICAgICAgLmlzT25saW5lPVwiJHt0aGlzLmlzT25saW5lfVwiXG4gICAgICAgICAgICAgICAgQHZpZXctY2hhbmdlPVwiJHsoZSkgPT4gdGhpcy5jdXJyZW50VmlldyA9IGUuZGV0YWlsfVwiXG4gICAgICAgICAgICA+PC90c3BtLXNpZGViYXI+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIDxtYWluIGNsYXNzPVwibWFpbi1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgPHRzcG0tdG9wYmFyIFxuICAgICAgICAgICAgICAgICAgICBAcmVmcmVzaD1cIiR7dGhpcy5mZXRjaERhdGF9XCJcbiAgICAgICAgICAgICAgICAgICAgQG9wZW4tbW9kYWw9XCIkeygpID0+IHRoaXMuc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yKCd0c3BtLW1vZGFsJykub3BlbigpfVwiXG4gICAgICAgICAgICAgICAgPjwvdHNwbS10b3BiYXI+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInZpZXctY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDx0c3BtLWRhc2hib2FyZCBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzPVwidmlldyAke3RoaXMuY3VycmVudFZpZXcgPT09ICdkYXNoYm9hcmQnID8gJ2FjdGl2ZScgOiAnJ31cIlxuICAgICAgICAgICAgICAgICAgICAgICAgLnByb2Nlc3Nlcz1cIiR7dGhpcy5wcm9jZXNzZXN9XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdGF0cz1cIiR7dGhpcy5zeXN0ZW1TdGF0c31cIlxuICAgICAgICAgICAgICAgICAgICA+PC90c3BtLWRhc2hib2FyZD5cblxuICAgICAgICAgICAgICAgICAgICA8dHNwbS1wcm9jZXNzLXRhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cInZpZXcgJHt0aGlzLmN1cnJlbnRWaWV3ID09PSAncHJvY2Vzc2VzJyA/ICdhY3RpdmUnIDogJyd9XCJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5wcm9jZXNzZXM9XCIke3RoaXMucHJvY2Vzc2VzfVwiXG4gICAgICAgICAgICAgICAgICAgID48L3RzcG0tcHJvY2Vzcy10YWJsZT5cblxuICAgICAgICAgICAgICAgICAgICA8dHNwbS10ZXJtaW5hbFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJ2aWV3ICR7dGhpcy5jdXJyZW50VmlldyA9PT0gJ3Rlcm1pbmFsJyA/ICdhY3RpdmUnIDogJyd9XCJcbiAgICAgICAgICAgICAgICAgICAgICAgID9hY3RpdmU9XCIke3RoaXMuY3VycmVudFZpZXcgPT09ICd0ZXJtaW5hbCd9XCJcbiAgICAgICAgICAgICAgICAgICAgPjwvdHNwbS10ZXJtaW5hbD5cblxuICAgICAgICAgICAgICAgICAgICA8dHNwbS1sb2dzXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cInZpZXcgJHt0aGlzLmN1cnJlbnRWaWV3ID09PSAnbG9ncycgPyAnYWN0aXZlJyA6ICcnfVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAucHJvY2Vzc2VzPVwiJHt0aGlzLnByb2Nlc3Nlc31cIlxuICAgICAgICAgICAgICAgICAgICA+PC90c3BtLWxvZ3M+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L21haW4+XG5cbiAgICAgICAgICAgIDx0c3BtLW1vZGFsIEBwcm9jZXNzLWFkZGVkPVwiJHt0aGlzLmZldGNoRGF0YX1cIj48L3RzcG0tbW9kYWw+XG4gICAgICAgIGA7XG4gICAgfVxufVxuXG5jdXN0b21FbGVtZW50cy5kZWZpbmUoJ3RzcG0tYXBwJywgVHNwbUFwcCk7XG4iLAogICAgIi8vIEltcG9ydCBMaXQgQ29tcG9uZW50c1xuaW1wb3J0ICcuL2NvbXBvbmVudHMvdHNwbS1zaWRlYmFyLnRzJztcbmltcG9ydCAnLi9jb21wb25lbnRzL3RzcG0tdG9wYmFyLnRzJztcbmltcG9ydCAnLi9jb21wb25lbnRzL3RzcG0tZGFzaGJvYXJkLnRzJztcbmltcG9ydCAnLi9jb21wb25lbnRzL3RzcG0tcHJvY2Vzcy1jYXJkLnRzJztcbmltcG9ydCAnLi9jb21wb25lbnRzL3RzcG0tcHJvY2Vzcy10YWJsZS50cyc7XG5pbXBvcnQgJy4vY29tcG9uZW50cy90c3BtLXRlcm1pbmFsLnRzJztcbmltcG9ydCAnLi9jb21wb25lbnRzL3RzcG0tbG9ncy50cyc7XG5pbXBvcnQgJy4vY29tcG9uZW50cy90c3BtLW1vZGFsLnRzJztcbmltcG9ydCAnLi9jb21wb25lbnRzL3RzcG0tYXBwLnRzJztcblxuY29uc29sZS5sb2coJ1RTUE0gV2ViIENvbXBvbmVudHMgTG9hZGVkJyk7XG4iCiAgXSwKICAibWFwcGluZ3MiOiAiO0FBQUE7QUFBQTtBQUVPLE1BQU0sb0JBQW9CLFdBQVc7QUFBQSxTQUNqQyxhQUFhO0FBQUEsSUFDaEIsYUFBYSxFQUFFLE1BQU0sT0FBTztBQUFBLElBQzVCLFVBQVUsRUFBRSxNQUFNLFFBQVE7QUFBQSxFQUM5QjtBQUFBLFNBRU8sU0FBUztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFB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QUFNLEtBQUssV0FBVyxjQUFjLFlBQVksRUFBRSxLQUFLO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxzQ0FLcEQsS0FBSyxnQkFBZ0IsY0FBYyxXQUFXO0FBQUEsc0NBQzlDLEtBQUs7QUFBQSxrQ0FDVCxLQUFLO0FBQUE7QUFBQTtBQUFBO0FBQUEsc0NBSUQsS0FBSyxnQkFBZ0IsY0FBYyxXQUFXO0FBQUEsc0NBQzlDLEtBQUs7QUFBQTtBQUFBO0FBQUE7QUFBQSxzQ0FJTCxLQUFLLGdCQUFnQixhQUFhLFdBQVc7QUFBQSxtQ0FDaEQsS0FBSyxnQkFBZ0I7QUFBQTtBQUFBO0FBQUE7QUFBQSxzQ0FJbEIsS0FBSyxnQkFBZ0IsU0FBUyxXQUFXO0FBQUEsc0NBQ3pDLEtBQUs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLDBDQUtELEtBQUs7QUFBQTtBQUFBO0FBRy9DO0FBRUEsZUFBZSxPQUFPLFlBQVksT0FBTzs7O0FDM0t6QyxRQUFRLElBQUksNEJBQTRCOyIsCiAgImRlYnVnSWQiOiAiQjI0RkFBRjY1QjdGNTFBODY0NzU2RTIxNjQ3NTZFMjEiLAogICJuYW1lcyI6IFtdCn0=
