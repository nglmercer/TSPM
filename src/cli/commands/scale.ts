import { EXIT_CODES } from '../../utils/config/constants';
import { log } from '../../utils/logger';
import { readProcessStatus } from '../state/status';

export function scaleCommand(name: string, count: string): void {
  const instanceCount = parseInt(count, 10);
  
  if (isNaN(instanceCount) || instanceCount < 1) {
    log.error('[TSPM] Invalid instance count');
    process.exit(EXIT_CODES.ERROR);
  }
  
  const status = readProcessStatus();
  
  // Check if process exists
  const instances = Object.keys(status).filter(k => k.startsWith(name));
  if (instances.length === 0) {
    log.error(`[TSPM] Process not found: ${name}`);
    process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
  }
  
  log.info(`[TSPM] Scaling ${name} from ${instances.length} to ${instanceCount} instances...`);
  log.warn('[TSPM] Note: Dynamic scaling requires daemon mode. Please restart in daemon mode.');
}
