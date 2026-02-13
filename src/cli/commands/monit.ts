import { log } from '../../utils/logger';
import { getProcessStats } from '../../utils/stats';
import { readProcessStatus } from '../state/status';
import { CliTable, printHeader } from '../ui';
import { getDefaultEmitter } from '../../utils/events';

interface MonitOptions {
  interval?: number;
  showHealth?: boolean;
  showEvents?: boolean;
}

export async function monitCommand(options: MonitOptions = {}): Promise<void> {
  const refreshInterval = options.interval || 1000;
  const showHealth = options.showHealth !== false;
  const showEvents = options.showEvents === true;
  
  // Event log for recent events
  const recentEvents: Array<{ time: string; type: string; message: string }> = [];
  
  // Subscribe to events if enabled
  if (showEvents) {
    const emitter = getDefaultEmitter();
    emitter.onAny((event) => {
      const time = new Date().toLocaleTimeString();
      let message = '';
      if ('processName' in event.data) {
        message = `${event.data.processName}`;
        if ('instanceId' in event.data) {
          message += ` [${event.data.instanceId}]`;
        }
      }
      recentEvents.push({ time, type: event.type, message });
      if (recentEvents.length > 10) {
        recentEvents.shift();
      }
    });
  }

  const update = async () => {
    const status = readProcessStatus();
    const processes = Object.entries(status);

    console.clear();
    printHeader('TSPM Process Monitor');

    if (processes.length === 0) {
      log.info('No processes running');
    } else {
      const statsPromises = processes.map(([_, data]) => 
        data.pid ? getProcessStats(data.pid) : Promise.resolve(null)
      );
      const allStats = await Promise.all(statsPromises);
      
      let totalCpu = 0;
      let totalMem = 0;
      let runningCount = 0;

      const table = new CliTable({
        head: ['name', 'status', 'cpu', 'memory', 'uptime', 'restarts', ...(showHealth ? ['health'] : [])]
      });

      for (let i = 0; i < processes.length; i++) {
        const [name, data] = processes[i]!;
        const stats = allStats[i];
        
        let cpuStr = '-';
        let memStr = '-';
        let uptimeStr = '-';
        let healthStr = '-';
        let currentState = data.state;

        if (stats) {
          cpuStr = `${stats.cpu.toFixed(1)}%`;
          memStr = `${(stats.memory / 1024 / 1024).toFixed(1)} MB`;
          uptimeStr = formatUptime(stats.uptime);
          
          // Color code CPU usage
          if (stats.cpu > 80) {
            cpuStr = `\x1b[31m${cpuStr}\x1b[0m`; // Red
          } else if (stats.cpu > 50) {
            cpuStr = `\x1b[33m${cpuStr}\x1b[0m`; // Yellow
          }
          
          // Color code memory usage
          const memMB = stats.memory / 1024 / 1024;
          if (memMB > 500) {
            memStr = `\x1b[31m${memStr}\x1b[0m`; // Red
          } else if (memMB > 200) {
            memStr = `\x1b[33m${memStr}\x1b[0m`; // Yellow
          }
          
          totalCpu += stats.cpu;
          totalMem += stats.memory;
          runningCount++;
        } else if (data.pid) {
          currentState = 'STOPPED';
        }
        
        // Health status
        if (showHealth && data.healthy !== undefined) {
          healthStr = data.healthy ? '\x1b[32m✓ healthy\x1b[0m' : '\x1b[31m✗ unhealthy\x1b[0m';
        }

        // Color code status
        let statusStr = currentState?.toUpperCase() || 'UNKNOWN';
        if (statusStr === 'RUNNING') {
          statusStr = `\x1b[32m${statusStr}\x1b[0m`; // Green
        } else if (statusStr === 'STOPPED' || statusStr === 'ERRORED') {
          statusStr = `\x1b[31m${statusStr}\x1b[0m`; // Red
        } else if (statusStr === 'RESTARTING') {
          statusStr = `\x1b[33m${statusStr}\x1b[0m`; // Yellow
        }

        const row = [
          name,
          statusStr,
          cpuStr,
          memStr,
          uptimeStr,
          data.restarts || 0
        ];
        
        if (showHealth) {
          row.push(healthStr);
        }
        
        table.push(row);
      }
      
      log.raw(`  Processes: ${processes.length} | Running: ${runningCount} | CPU: ${totalCpu.toFixed(1)}% | Mem: ${(totalMem / 1024 / 1024).toFixed(1)} MB\n`);
      table.render();
    }

    // Show recent events if enabled
    if (showEvents && recentEvents.length > 0) {
      log.raw('\n\x1b[36mRecent Events:\x1b[0m');
      log.raw('─'.repeat(60));
      for (const event of recentEvents) {
        log.raw(`  ${event.time} | ${event.type.padEnd(20)} | ${event.message}`);
      }
    }

    log.raw(`\n\x1b[90mLast Update: ${new Date().toLocaleTimeString()}\x1b[0m`);
    log.raw(`\x1b[90mMonitoring ${processes.length} process(es). Press Ctrl+C to exit.\x1b[0m`);
  };

  await update();
  const timer = setInterval(update, refreshInterval);

  // Keep the process alive
  return new Promise(() => {
    process.on('SIGINT', () => {
      clearInterval(timer);
      console.log('\n\x1b[36m[TSPM] Monitor stopped\x1b[0m');
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
