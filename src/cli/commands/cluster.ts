import { EXIT_CODES } from '../../utils/config/constants';
import { log } from '../../utils/logger';
import { readProcessStatus } from '../state/status';
import { CliTable, printHeader } from '../ui';

export function clusterCommand(name?: string): void {
  const status = readProcessStatus();
  
  if (!name) {
    // Show all clusters
    printHeader('TSPM Clusters');
    
    const clusterNames = new Set<string>();
    for (const [procName] of Object.entries(status)) {
      // Extract base name from instance name
      const baseName = procName.replace(/-(\d+)$/, '');
      if (baseName !== procName) {
        clusterNames.add(baseName);
      }
    }
    
    if (clusterNames.size === 0) {
      log.info('No clusters running');
    } else {
      const table = new CliTable({
        head: ['id', 'name', 'instances', 'strategy']
      });

      let index = 0;
      for (const clusterName of clusterNames) {
        const instances = Object.keys(status).filter(k => k.startsWith(clusterName));
        table.push([
          index.toString(),
          clusterName,
          instances.length.toString(),
          'round-robin'
        ]);
        index++;
      }
      table.render();
    }
  } else {
    // Show specific cluster
    const instances = Object.keys(status).filter(k => k.startsWith(name));
    
    if (instances.length === 0) {
      log.error(`[TSPM] No cluster found for: ${name}`);
      process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
    }
    
    printHeader(`Cluster: ${name}`);
    log.raw(`Instances: ${instances.length}`);
    log.raw(`Strategy: round-robin\n`);
    
    const table = new CliTable({
      head: ['id', 'name', 'pid', 'status', 'restarts']
    });
    
    let idx = 0;
    for (const instName of instances) {
      const data = status[instName];
      const pidStr = data.pid?.toString() || '-';
      const statusStr = (data.state || 'unknown').toUpperCase();
      table.push([
        idx.toString(),
        instName,
        pidStr,
        statusStr,
        '0'
      ]);
      idx++;
    }
    table.render();
  }
}
