import { log } from '../../utils/logger';
import { readProcessStatus } from '../state/status';
import { CliTable, printHeader } from '../ui';

export function listCommand(): void {
  const status = readProcessStatus();
  const processes = Object.entries(status);

  if (processes.length === 0) {
    printHeader('TSPM Process List');
    log.info('No processes running');
    return;
  }

  printHeader('TSPM Process List');

  const table = new CliTable({
    head: ['id', 'name', 'mode', 'pid', 'status', 'restarts']
  });

  let index = 0;
  for (const [name, data] of processes) {
    const pidStr = data.pid?.toString() || '-';
    const statusStr = data.state?.toUpperCase() || 'UNKNOWN';
    const restartStr = '0';

    table.push([
      index.toString(),
      name,
      'fork',
      pidStr,
      statusStr,
      restartStr
    ]);
    index++;
  }

  table.render();
  log.raw(`\n Total processes: ${processes.length}\n`);
}
