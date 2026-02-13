/**
 * TSPM CLI - Command Line Interface
 * A professional CLI for process management using Commander.js
 * Provides commands for process management similar to PM2
 */

import { EXIT_CODES } from '../utils/config/constants';
import { log } from '../utils/logger';
import { createProgram } from './program';

/**
 * Main CLI entry point
 */
export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const program = createProgram();

  try {
    await program.parseAsync(argv, { from: 'user' });
  } catch (error) {
    log.error(`[TSPM] Error: ${error}`);
    process.exit(EXIT_CODES.ERROR);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}
