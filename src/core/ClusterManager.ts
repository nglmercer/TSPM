import { ProcessCluster, type LoadBalanceStrategy } from "../utils/loadbalancer";
import { CLUSTER_CONFIG } from "../utils/config/constants";
import type { ProcessConfig } from "./types";

export class ClusterManager {
  private clusters: Map<string, ProcessCluster> = new Map();

  getOrCreateCluster(config: ProcessConfig): ProcessCluster | undefined {
    const instanceCount = config.instances || 1;
    if (instanceCount <= 1 && !this.clusters.has(config.name)) return undefined;

    let cluster = this.clusters.get(config.name);
    if (!cluster && instanceCount > 1) {
      const strategy = (config.lbStrategy || CLUSTER_CONFIG.defaultStrategy) as LoadBalanceStrategy;
      cluster = new ProcessCluster(config.name, strategy);
      this.clusters.set(config.name, cluster);
    }
    return cluster;
  }

  getCluster(name: string): ProcessCluster | undefined {
    return this.clusters.get(name);
  }

  removeCluster(name: string): void {
    this.clusters.delete(name);
  }

  getAllClusters(): Map<string, ProcessCluster> {
    return this.clusters;
  }

  get size(): number {
    return this.clusters.size;
  }
}
