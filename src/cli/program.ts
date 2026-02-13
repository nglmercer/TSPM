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
  devCommand,
  flushCommand,
  reloadLogsCommand,
  saveCommand,
  resurrectCommand,
  startupCommand,
  unstartupCommand,
  resetCommand,
  prettylistCommand,
  serveCommand,
  reportCommand,
  deployCommand
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
    .description('Flush all logs (clear log files)')
    .option('-n, --name <name>', 'Flush logs for the specified process')
    .option('-a, --all', 'Flush logs for all processes')
    .option('--err', 'Flush only error logs')
    .option('--out', 'Flush only output logs')
    .action((options) => {
      flushCommand({
        name: options.name,
        err: options.err,
        out: options.out,
        all: options.all,
      });
    });

  // ReloadLogs command (reopen log files)
  program
    .command('reloadLogs')
    .description('Reload log files (reopen for external log rotation)')
    .option('-n, --name <name>', 'Reload logs for the specified process')
    .option('-a, --all', 'Reload logs for all processes')
    .action((options) => {
      reloadLogsCommand({
        name: options.name,
      });
    });

  // Reset command (reset all metrics)
  program
    .command('reset')
    .description('Reset all metrics for a process')
    .option('-n, --name <name>', 'Reset metrics for the specified process')
    .option('-a, --all', 'Reset metrics for all processes')
    .action((options) => {
      if (!options.name && !options.all) {
        log.error('[TSPM] Please specify a process name with --name or use --all');
        process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
      }
      resetCommand(options);
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

  // Save command
  program
    .command('save')
    .description('Save current process list to dump file')
    .action(saveCommand);

  // Resurrect command
  program
    .command('resurrect')
    .description('Restore processes from dump file')
    .action(resurrectCommand);

  // Startup command
  program
    .command('startup')
    .description('Generate system startup script')
    .argument('[platform]', 'Platform to generate script for (systemd)', 'systemd')
    .option('-u, --user <user>', 'User to run the service as')
    .action((platform, options) => {
      startupCommand({ system: platform, user: options.user });
    });

  // Unstartup command
  program
    .command('unstartup')
    .description('Remove startup script')
    .action(unstartupCommand);

  // Prettylist command
  program
    .command('prettylist')
    .description('Pretty-printed JSON process list')
    .option('-n, --name <name>', 'Show details for the specified process')
    .action(prettylistCommand);

  // Serve command
  program
    .command('serve')
    .description('Serve static files from a directory')
    .argument('[path]', 'Directory to serve (default: current directory)', '.')
    .option('-p, --port <number>', 'Port to listen on', '8080')
    .option('--spa', 'Enable SPA mode (fallback to index.html)', false)
    .option('--cors', 'Enable CORS headers', false)
    .action((path, options) => {
      serveCommand(path, {
        port: parseInt(options.port, 10),
        spa: options.spa,
        cors: options.cors,
      });
    });

  // Report command
  program
    .command('report')
    .description('Generate diagnostic report')
    .option('-o, --output <file>', 'Output file path (default: stdout)')
    .action(reportCommand);

  // Deploy command
  program
    .command('deploy')
    .description('Deploy application to remote server via SSH')
    .argument('[environment]', 'Environment to deploy to (default: production)', 'production')
    .option('-c, --config <file>', 'Configuration file path')
    .option('--repo <url>', 'Git repository URL (overrides config)')
    .option('--local <path>', 'Local path to deploy from (alternative to git)')
    .option('-v, --verbose', 'Verbose output', false)
    .action((environment, options) => {
      deployCommand({
        environment,
        config: options.config,
        repo: options.repo,
        localPath: options.local,
        verbose: options.verbose,
      });
    });

  return program;
}
