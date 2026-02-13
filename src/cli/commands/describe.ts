import { EXIT_CODES } from '../../utils/config/constants';
import { log } from '../../utils/logger';
import { readProcessStatus } from '../state/status';
import { CliTable, printHeader } from '../ui';

export function describeCommand(name: string): void {
  const status = readProcessStatus();

  if (!name || !status[name]) {
    log.error(`[TSPM] Process not found: ${name}`);
    process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
  }

  const proc = status[name];
  const uptime = proc.startedAt ? Math.floor((Date.now() - proc.startedAt) / 1000) : 0;
  const uptimeStr = uptime > 0 ? `${uptime}s` : '-';

  printHeader(`Process Details: ${name}`);

  const table = new CliTable({
    head: ['field', 'value']
  });

  table.push(
    ['name', name],
    ['pid', proc.pid.toString()],
    ['status', (proc.state || 'unknown').toUpperCase()],
    ['mode', 'fork'],
    ['restarts', '0'],
    ['uptime', uptimeStr],
    ['watch', 'disabled']
  );

  table.render();
}
