import { join } from 'path';

export const TSPM_HOME = process.env.TSPM_HOME || join(process.env.HOME || '.', '.tspm');
export const DAEMON_PID_FILE = join(TSPM_HOME, 'daemon.pid');
export const STATUS_FILE = join(TSPM_HOME, 'status.json');
export const LAST_CONFIG_FILE = join(TSPM_HOME, 'last-config.json');
export const DUMP_FILE = join(TSPM_HOME, 'dump.json');
export const STARTUP_DIR = join(TSPM_HOME, 'startup');
