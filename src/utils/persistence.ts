import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { log } from "./logger";
import { APP_CONSTANTS } from "./config/constants";

export class PersistenceManager {
    private static readonly DUMP_FILE = ".tspm/dump.json";

    static save(data: any): void {
        try {
            const path = join(process.cwd(), this.DUMP_FILE);
            const dir = dirname(path);
            
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }

            writeFileSync(path, JSON.stringify(data, null, 2));
            log.debug(`${APP_CONSTANTS.LOG_PREFIX} State persisted to ${this.DUMP_FILE}`);
        } catch (e: any) {
            log.error(`${APP_CONSTANTS.LOG_PREFIX} Failed to persist state: ${e.message}`);
        }
    }

    static load(): any | null {
        try {
            const path = join(process.cwd(), this.DUMP_FILE);
            if (!existsSync(path)) return null;

            const content = readFileSync(path, "utf-8");
            return JSON.parse(content);
        } catch (e: any) {
            log.error(`${APP_CONSTANTS.LOG_PREFIX} Failed to load state: ${e.message}`);
            return null;
        }
    }
}
