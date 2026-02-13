import { ENV_VARS } from "../utils/config/constants";
import { log } from "../utils/logger";
import type { ProcessConfig } from "./types";

export class ProcessEnvManager {
  /**
   * Parse dotenv content
   */
  static parseDotEnv(content: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let key = match[1]!;
        let value = match[2] || '';
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Prepare environment variables for the process
   */
  static async prepareEnv(config: ProcessConfig, instanceId: number, fullProcessName: string): Promise<Record<string, string>> {
    let dotEnvVars: Record<string, string> = {};
    if (config.dotEnv) {
      try {
        const envFile = Bun.file(config.dotEnv);
        if (await envFile.exists()) {
          const content = await envFile.text();
          dotEnvVars = this.parseDotEnv(content);
        } else {
          log.warn(`[TSPM] dotEnv file not found: ${config.dotEnv}`);
        }
      } catch (e) {
        log.error(`[TSPM] Error loading dotEnv for ${fullProcessName}: ${e}`);
      }
    }

    return { 
      ...process.env,
      ...dotEnvVars,
      ...config.env,
      [ENV_VARS.PROCESS_NAME]: fullProcessName,
      [ENV_VARS.INSTANCE_ID]: instanceId.toString(),
    } as Record<string, string>;
  }
}
