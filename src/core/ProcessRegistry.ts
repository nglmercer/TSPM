import type { ManagedProcess } from "./ManagedProcess";
import type { ProcessGroup } from "./types";

export class ProcessRegistry {
  private processes: Map<string, ManagedProcess> = new Map();
  private namespaces: Map<string, Set<string>> = new Map();
  private clusterGroups: Map<string, Set<string>> = new Map();

  add(name: string, process: ManagedProcess): void {
    this.processes.set(name, process);
    const config = process.getConfig();

    // Track namespace
    if (config.namespace) {
      if (!this.namespaces.has(config.namespace)) {
        this.namespaces.set(config.namespace, new Set());
      }
      this.namespaces.get(config.namespace)!.add(name);
    }

    // Track cluster group
    if (config.clusterGroup) {
      if (!this.clusterGroups.has(config.clusterGroup)) {
        this.clusterGroups.set(config.clusterGroup, new Set());
      }
      this.clusterGroups.get(config.clusterGroup)!.add(name);
    }
  }

  get(name: string): ManagedProcess | undefined {
    return this.processes.get(name);
  }

  delete(name: string): boolean {
    const process = this.processes.get(name);
    if (!process) return false;

    const config = process.getConfig();
    if (config.namespace) {
      this.namespaces.get(config.namespace)?.delete(name);
    }
    if (config.clusterGroup) {
      this.clusterGroups.get(config.clusterGroup)?.delete(name);
    }
    return this.processes.delete(name);
  }

  getAll(): ManagedProcess[] {
    return Array.from(this.processes.values());
  }

  getByNamespace(namespace: string): ManagedProcess[] {
    const names = this.namespaces.get(namespace);
    if (!names) return [];
    return Array.from(names).map(name => this.processes.get(name)).filter(Boolean) as ManagedProcess[];
  }

  getByClusterGroup(group: string): ManagedProcess[] {
    const names = this.clusterGroups.get(group);
    if (!names) return [];
    return Array.from(names).map(name => this.processes.get(name)).filter(Boolean) as ManagedProcess[];
  }

  getNamespaces(): string[] {
    return Array.from(this.namespaces.keys());
  }

  getClusterGroups(): string[] {
    return Array.from(this.clusterGroups.keys());
  }

  getProcessGroups(): ProcessGroup[] {
    const groups: ProcessGroup[] = [];
    
    for (const [namespace, processNames] of this.namespaces.entries()) {
      const processNamesArray = Array.from(processNames);
      const processes = processNamesArray.map(name => this.processes.get(name)).filter(Boolean) as ManagedProcess[];
      
      groups.push({
        name: namespace,
        namespace,
        processCount: new Set(processes.map(p => p.getConfig().name)).size,
        totalInstances: processes.length,
        processNames: processNamesArray,
      });
    }
    
    for (const [groupName, processNames] of this.clusterGroups.entries()) {
      if (!groups.find(g => g.name === groupName)) {
        const processNamesArray = Array.from(processNames);
        const processes = processNamesArray.map(name => this.processes.get(name)).filter(Boolean) as ManagedProcess[];
        
        groups.push({
          name: groupName,
          namespace: 'default',
          processCount: new Set(processes.map(p => p.getConfig().name)).size,
          totalInstances: processes.length,
          processNames: processNamesArray,
        });
      }
    }
    
    return groups;
  }

  get size(): number {
    return this.processes.size;
  }

  entries() {
    return this.processes.entries();
  }

  values() {
    return this.processes.values();
  }

  keys() {
    return this.processes.keys();
  }

  has(name: string): boolean {
    return this.processes.has(name);
  }
}
