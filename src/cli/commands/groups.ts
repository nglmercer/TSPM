import { log } from '../../utils/logger';
import { readProcessStatus } from '../state/status';
import { CliTable, printHeader } from '../ui';

export function groupsCommand(): void {
  const status = readProcessStatus();
  
  // Group by namespace
  const namespaceGroups = new Map<string, string[]>();
  const clusterGroups = new Map<string, string[]>();
  
  for (const [procName, data] of Object.entries(status)) {
    const namespace = data.config?.namespace || 'default';
    const clusterGroup = data.config?.clusterGroup;
    
    if (!namespaceGroups.has(namespace)) {
      namespaceGroups.set(namespace, []);
    }
    namespaceGroups.get(namespace)!.push(procName);
    
    if (clusterGroup) {
      if (!clusterGroups.has(clusterGroup)) {
        clusterGroups.set(clusterGroup, []);
      }
      clusterGroups.get(clusterGroup)!.push(procName);
    }
  }
  
  printHeader('TSPM Namespaces');
  
  if (namespaceGroups.size === 0) {
    log.info('No namespaces');
  } else {
    const table = new CliTable({
      head: ['id', 'namespace', 'processes']
    });

    let index = 0;
    for (const [namespace, procs] of namespaceGroups.entries()) {
      table.push([
        index.toString(),
        namespace,
        procs.length.toString()
      ]);
      index++;
    }
    table.render();
  }
  
  if (clusterGroups.size > 0) {
    log.raw('\n');
    printHeader('TSPM Cluster Groups');
    
    const table = new CliTable({
      head: ['id', 'group', 'processes']
    });

    let index = 0;
    for (const [group, procs] of clusterGroups.entries()) {
      table.push([
        index.toString(),
        group,
        procs.length.toString()
      ]);
      index++;
    }
    table.render();
  }
}
