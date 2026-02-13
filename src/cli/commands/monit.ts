import { log } from '../../utils/logger';
import { getProcessStats } from '../../utils/stats';
import { readProcessStatus } from '../state/status';
import { CliTable, printHeader } from '../ui';

export async function monitCommand(): Promise<void> {
  const status = readProcessStatus();
  const processes = Object.entries(status);

  console.clear();
  printHeader('TSPM Process Monitor');

  if (processes.length === 0) {
    log.info('No processes running');
  } else {
    const table = new CliTable({
      head: ['name', 'status', 'cpu', 'memory']
    });

    for (const [name, data] of processes) {
      let cpuStr = '-';
      let memStr = '-';
      let currentState = data.state;

      if (data.pid) {
        const stats = await getProcessStats(data.pid as number);
        if (stats) {
          cpuStr = `${stats.cpu.toFixed(1)}%`;
          memStr = `${(stats.memory / 1024 / 1024).toFixed(1)} MB`;
        } else {
          currentState = 'STOPPED';
        }
      }

      table.push([
        name,
        currentState.toUpperCase(),
        cpuStr,
        memStr
      ]);
    }
    table.render();
  }

  log.raw(`\nMonitoring ${processes.length} process(es). Press Ctrl+C to exit.`);
}
