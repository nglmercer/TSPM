import { Command } from 'commander';
import { EXIT_CODES } from '../utils/config/constants';
import { log } from '../utils/logger';
import {
  startCommand,
  stopCommand,
  restartCommand,
  reloadCommand,
  deleteCommand,
  listCommand,
  logsCommand,
  describeCommand,
  monitCommand,
  clusterCommand,
  scaleCommand,
  groupsCommand,
  devCommand
} from './commands';

/**
 * Set up the CLI program using Commander.js
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name('tspm')
    .description('TSPM - TypeScript Process Manager\nA CLI for managing TypeScript/Node.js processes similar to PM2')
    .version('1.0.0')
    .exitOverride((err) => {
      if (err.code === 'commander.help') {
        process.exit(0);
      }
      process.exit(err.exitCode || 1);
    })
    .configureHelp({
      showGlobalOptions: true,
      sortSubcommands: true,
    })
    .showHelpAfterError();

  // Start command
  program
    .command('start')
    .description('Start a process or ecosystem file')
    .option('-c, --config <file>', 'Configuration file path', 'tspm.yaml')
    .option('-n, --name <name>', 'Start only the specified process by name')
    .option('-w, --watch', 'Enable file watching for auto-restart', false)
    .option('-d, --daemon', 'Run in daemon mode (background)', false)
    .option('-e, --env <env...>', 'Environment variables to set')
    .action((options) => startCommand(options.config, options));

  // Stop command
  program
    .command('stop')
    .description('Stop a running process')
    .option('-n, --name <name>', 'Stop only the specified process by name')
    .option('-a, --all', 'Stop all running processes')
    .action((options) => {
      if (!options.name && !options.all) {
        log.error('[TSPM] Please specify a process name with --name or use --all');
        process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
      }
      stopCommand(options);
    });

  // Restart command
  program
    .command('restart')
    .description('Restart a running process')
    .argument('[config-file]', 'Configuration file path (default: tspm.yaml)', 'tspm.yaml')
    .option('-n, --name <name>', 'Restart only the specified process by name')
    .option('-a, --all', 'Restart all processes')
    .action(restartCommand);

  // Reload command
  program
    .command('reload')
    .description('Reload process(es) without downtime (alias for restart)')
    .argument('[config-file]', 'Configuration file path (default: tspm.yaml)', 'tspm.yaml')
    .option('-n, --name <name>', 'Reload only the specified process by name')
    .option('-a, --all', 'Reload all processes')
    .action(reloadCommand);

  // Delete command
  program
    .command('delete')
    .description('Delete a process from the list (stops it first if running)')
    .option('-n, --name <name>', 'Delete the specified process by name')
    .option('-a, --all', 'Delete all processes')
    .action((options) => {
      if (!options.name && !options.all) {
        log.error('[TSPM] Please specify a process name with --name or use --all');
        process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
      }
      deleteCommand(options);
    });

  // List command
  program
    .command('list')
    .alias('ls')
    .description('List all managed processes')
    .action(listCommand);

  // Logs command
  program
    .command('logs')
    .description('Show logs for a process')
    .option('-n, --name <name>', 'Show logs for the specified process')
    .option('-l, --lines <number>', 'Number of lines to show', '50')
    .option('-r, --raw', 'Raw output (no headers)', false)
    .action((options) => {
      logsCommand({
        name: options.name,
        lines: parseInt(options.lines, 10),
        raw: options.raw,
      });
    });

  // Describe command
  program
    .command('describe')
    .alias('desc')
    .description('Show detailed information about a process')
    .argument('<name>', 'Process name')
    .action(describeCommand);

  // Monit command
  program
    .command('monit')
    .description('Real-time process monitoring (experimental)')
    .action(monitCommand);

  // Flush command (clear logs)
  program
    .command('flush')
    .description('Flush all logs')
    .action(() => {
      log.info('[TSPM] Log flushing not yet implemented');
    });

  // Reset command (reset all metrics)
  program
    .command('reset')
    .description('Reset all metrics for a process')
    .option('-n, --name <name>', 'Reset metrics for the specified process')
    .option('-a, --all', 'Reset metrics for all processes')
    .action(() => {
      log.info('[TSPM] Metrics reset not yet implemented');
    });

  // Cluster command
  program
    .command('cluster')
    .description('Show cluster information for a process')
    .argument('[name]', 'Process name')
    .action(clusterCommand);

  // Scale command
  program
    .command('scale')
    .description('Scale cluster instances')
    .argument('<name>', 'Process name to scale')
    .argument('<count>', 'Number of instances')
    .action(scaleCommand);

  // Groups command
  program
    .command('groups')
    .description('Show process groups and namespaces')
    .action(groupsCommand);

  // Dev command
  program
    .command('dev')
    .description('Start processes in development mode with hot-reload')
    .argument('[config-file]', 'Configuration file path (default: tspm.yaml)', 'tspm.yaml')
    .option('-p, --port <number>', 'API port (default: 3000)', '3000')
    .action(devCommand);

  return program;
}
