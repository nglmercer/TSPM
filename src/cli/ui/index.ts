export * from './Table';

import { log } from '../../utils/logger';

/**
 * Print a nice header for the CLI
 */
export function printHeader(title: string): void {
  const width = 60;
  const padding = Math.max(0, Math.floor((width - title.length) / 2));
  const innerWidth = width + 1;
  log.raw('\n' + '╔' + '═'.repeat(innerWidth) + '╗');
  log.raw('║' + ' '.repeat(padding) + title.padEnd(innerWidth - padding) + '║');
  log.raw('╚' + '═'.repeat(innerWidth) + '╝' + '\n');
}
