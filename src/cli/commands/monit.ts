import { log } from '../../utils/logger';
import { getProcessStats } from '../../utils/stats';
import { readProcessStatus } from '../state/status';
import { CliTable, printHeader } from '../ui';

export async function monitCommand(): Promise<void> {
  const refreshInterval = 1000;

  const update = async () => {
    const status = readProcessStatus();
    const processes = Object.entries(status);

    console.clear();
    printHeader('TSPM Process Monitor');

    if (processes.length === 0) {
      log.info('No processes running');
    } else {
      const table = new CliTable({
        head: ['name', 'status', 'cpu', 'memory', 'uptime', 'restarts']
      });

      for (const [name, data] of processes) {
        let cpuStr = '-';
        let memStr = '-';
        let uptimeStr = '-';
        let currentState = data.state;

        if (data.pid) {
          const stats = await getProcessStats(data.pid as number);
          if (stats) {
            cpuStr = `${stats.cpu.toFixed(1)}%`;
            memStr = `${(stats.memory / 1024 / 1024).toFixed(1)} MB`;
            uptimeStr = formatUptime(stats.uptime);
          } else {
            currentState = 'STOPPED';
          }
        }

        table.push([
          name,
          currentState.toUpperCase(),
          cpuStr,
          memStr,
          uptimeStr,
          data.restarts || 0
        ]);
      }
      table.render();
    }

    log.raw(`\nLast Update: ${new Date().toLocaleTimeString()}`);
    log.raw(`Monitoring ${processes.length} process(es). Press Ctrl+C to exit.`);
  };

  await update();
  const timer = setInterval(update, refreshInterval);

  // Keep the process alive
  return new Promise(() => {
    process.on('SIGINT', () => {
      clearInterval(timer);
      process.exit(0);
    });
  });
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}
