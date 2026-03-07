/**
 * TSPM Frontend Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // State
    let socket;
    let processes = [];
    let currentView = 'dashboard';
    let logs = [];
    const MAX_LOGS = 1000;
    let autoscroll = true;

    // Elements
    const views = document.querySelectorAll('.view');
    const navBtns = document.querySelectorAll('.nav-btn');
    const processGrid = document.getElementById('process-grid');
    const processTableBody = document.querySelector('#process-table tbody');
    const terminalOut = document.getElementById('terminal-out');
    const terminalInput = document.getElementById('terminal-input');
    const logOutput = document.getElementById('log-output');
    const modalProcess = document.getElementById('modal-process');
    const addProcessForm = document.getElementById('add-process-form');

    // Stats Elements
    const statTotal = document.getElementById('stat-total');
    const statCpu = document.getElementById('stat-cpu');
    const statMem = document.getElementById('stat-mem');
    const statUptime = document.getElementById('stat-uptime');

    // --- Navigation ---
    function switchView(viewId) {
        currentView = viewId;
        views.forEach(v => v.classList.remove('active'));
        navBtns.forEach(b => b.classList.remove('active'));

        document.getElementById(`view-${viewId}`).classList.add('active');
        document.querySelector(`.nav-btn[data-view="${viewId}"]`).classList.add('active');
        
        if (viewId === 'terminal') {
            terminalInput.focus();
        }
    }

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // --- WebSocket Connection ---
    function connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        socket = new WebSocket(`${protocol}//${host}/ws`);

        socket.onopen = () => {
            console.log('Connected to TSPM Node');
            document.querySelector('.status-dot').className = 'status-dot online';
            fetchData();
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleUpdate(data);
        };

        socket.onclose = () => {
            console.log('Disconnected from TSPM Node');
            document.querySelector('.status-dot').className = 'status-dot offline';
            setTimeout(connect, 3000);
        };
    }

    function handleUpdate(data) {
        switch (data.type) {
            case 'process:update':
                processes = data.payload;
                renderProcesses();
                updateStats();
                break;
            case 'process:log':
                appendLog(data.payload);
                break;
            case 'terminal:out':
                appendTerminal(data.payload);
                break;
            case 'system:stats':
                updateStats(data.payload);
                break;
        }
    }

    // --- Data Fetching ---
    async function fetchData() {
        try {
            const res = await fetch('/api/v1/status');
            const data = await res.json();
            if (data.success) {
                processes = data.data.processes;
                renderProcesses();
                updateStats();
            }
        } catch (err) {
            console.error('Failed to fetch data', err);
        }
    }

    // --- Rendering ---
    function renderProcesses() {
        // Render Grid
        processGrid.innerHTML = processes.map(p => `
            <div class="process-card ${p.state}">
                <div class="process-card-header">
                    <div class="process-info">
                        <h4>${p.name}</h4>
                        <span class="process-badge status-${p.state === 'running' ? 'online' : 'offline'}">${p.state}</span>
                    </div>
                    <div class="process-id text-muted">#${p.pid || 'N/A'}</div>
                </div>
                <div class="process-stats-mini">
                    <span><i data-lucide="activity" style="width:12px"></i> ${p.cpu || 0}%</span>
                    <span><i data-lucide="database" style="width:12px"></i> ${formatBytes(p.memory || 0)}</span>
                </div>
                <div class="process-actions">
                    <button class="btn-icon" title="Restart" onclick="processAction('${p.name}', 'restart')"><i data-lucide="refresh-ccw"></i></button>
                    <button class="btn-icon" title="Stop" onclick="processAction('${p.name}', 'stop')"><i data-lucide="square"></i></button>
                    <button class="btn-icon" title="Start" onclick="processAction('${p.name}', 'start')"><i data-lucide="play"></i></button>
                    <button class="btn-icon" title="Logs" onclick="viewLogs('${p.name}')"><i data-lucide="file-text"></i></button>
                </div>
            </div>
        `).join('');

        // Render Table
        processTableBody.innerHTML = processes.map(p => `
            <tr>
                <td class="font-bold">${p.name}</td>
                <td><span class="process-badge status-${p.state === 'running' ? 'online' : 'offline'}">${p.state}</span></td>
                <td>${p.pid || '-'}</td>
                <td>${p.instanceId || 0}</td>
                <td>${formatBytes(p.memory || 0)}</td>
                <td>${p.cpu || 0}%</td>
                <td>${formatUptime(p.uptime)}</td>
                <td>
                    <div class="actions">
                        <button class="btn-icon" onclick="processAction('${p.name}', 'restart')"><i data-lucide="refresh-ccw"></i></button>
                        <button class="btn-icon" onclick="processAction('${p.name}', 'stop')"><i data-lucide="square"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');

        lucide.createIcons();
    }

    function updateStats(systemStats) {
        statTotal.textContent = processes.length;
        
        let totalCpu = 0;
        let totalMem = 0;
        processes.forEach(p => {
            totalCpu += (p.cpu || 0);
            totalMem += (p.memory || 0);
        });

        statCpu.textContent = `${Math.round(totalCpu)}%`;
        statMem.textContent = formatBytes(totalMem);
        
        // Update progress bars
        const cpuBar = document.querySelector('#stat-cpu + .stat-footer .progress');
        if (cpuBar) cpuBar.style.width = `${Math.min(100, totalCpu)}%`;
    }

    // --- Actions ---
    window.processAction = async (name, action) => {
        try {
            const res = await fetch(`/api/v1/process/${name}/${action}`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                showToast(`Successfully ${action}ed ${name}`, 'success');
                fetchData();
            } else {
                showToast(data.error, 'error');
            }
        } catch (err) {
            showToast('Action failed', 'error');
        }
    };

    window.viewLogs = (name) => {
        switchView('logs');
        document.getElementById('log-process-select').value = name;
    };

    // --- Terminal ---
    terminalInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const cmd = terminalInput.value.trim();
            if (!cmd) return;

            appendTerminal(`$ ${cmd}`, 'input');
            terminalInput.value = '';

            try {
                const res = await fetch('/api/v1/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command: cmd })
                });
                const data = await res.json();
                if (data.output) {
                    appendTerminal(data.output);
                }
                if (data.error) {
                    appendTerminal(data.error, 'error');
                }
            } catch (err) {
                appendTerminal('Failed to execute command', 'error');
            }
        }
    });

    function appendTerminal(msg, type = '') {
        const p = document.createElement('p');
        p.className = `log-line ${type}`;
        p.textContent = msg;
        terminalOut.appendChild(p);
        terminalOut.scrollTop = terminalOut.scrollHeight;
    }

    // --- Logs ---
    function appendLog(logEntry) {
        const line = document.createElement('div');
        line.className = 'log-line';
        
        const timestamp = new Date().toLocaleTimeString();
        line.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> <span class="log-process">[${logEntry.processName}]</span> ${escapeHtml(logEntry.message)}`;
        
        logOutput.appendChild(line);
        if (logOutput.children.length > MAX_LOGS) {
            logOutput.removeChild(logOutput.firstChild);
        }
        
        if (autoscroll) {
            logOutput.scrollTop = logOutput.scrollHeight;
        }
    }

    // --- Modals ---
    document.getElementById('new-process').addEventListener('click', () => {
        modalProcess.classList.add('active');
    });

    document.querySelectorAll('.btn-close, .btn-close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            modalProcess.classList.remove('active');
        });
    });

    addProcessForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addProcessForm);
        const config = Object.fromEntries(formData.entries());
        
        try {
            const res = await fetch('/api/v1/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            const data = await res.json();
            if (data.success) {
                modalProcess.classList.remove('active');
                showToast('Process spawned successfully', 'success');
                fetchData();
            } else {
                showToast(data.error, 'error');
            }
        } catch (err) {
            showToast('Failed to spawn process', 'error');
        }
    });

    // --- Helpers ---
    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function formatUptime(ms) {
        if (!ms) return '0s';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showToast(msg, type = 'info') {
        // Simple alert for now, can be improved to a nice toast
        alert(`${type.toUpperCase()}: ${msg}`);
    }

    // Start connection
    connect();
});
