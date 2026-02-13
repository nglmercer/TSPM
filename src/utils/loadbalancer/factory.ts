import { LOAD_BALANCE_STRATEGY, type LoadBalanceStrategy } from '../config/constants';
import { 
  RoundRobinBalancer, 
  RandomBalancer, 
  LeastConnectionsBalancer, 
  LeastCpuBalancer, 
  LeastMemoryBalancer, 
  IpHashBalancer, 
  WeightedBalancer 
} from './strategies';

/**
 * Factory for creating load balancer instances
 */
export class LoadBalancerFactory {
  /**
   * Create a load balancer based on strategy
   */
  static create(strategy: LoadBalanceStrategy) {
    switch (strategy) {
      case LOAD_BALANCE_STRATEGY.ROUND_ROBIN:
        return new RoundRobinBalancer();
      case LOAD_BALANCE_STRATEGY.RANDOM:
        return new RandomBalancer();
      case LOAD_BALANCE_STRATEGY.LEAST_CONNECTIONS:
        return new LeastConnectionsBalancer();
      case LOAD_BALANCE_STRATEGY.LEAST_CPU:
        return new LeastCpuBalancer();
      case LOAD_BALANCE_STRATEGY.LEAST_MEMORY:
        return new LeastMemoryBalancer();
      case LOAD_BALANCE_STRATEGY.IP_HASH:
        return new IpHashBalancer();
      case LOAD_BALANCE_STRATEGY.WEIGHTED:
        return new WeightedBalancer();
      default:
        return new RoundRobinBalancer();
    }
  }

  /**
   * Get all available strategies
   */
  static getStrategies(): LoadBalanceStrategy[] {
    return Object.values(LOAD_BALANCE_STRATEGY);
  }

  /**
   * Validate if a strategy is supported
   */
  static isValidStrategy(strategy: string): boolean {
    return Object.values(LOAD_BALANCE_STRATEGY).includes(strategy as LoadBalanceStrategy);
  }
}
