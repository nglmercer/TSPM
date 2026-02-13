import { file } from "bun";

export interface ProcessConfig {
  name: string;
  script: string;
  args?: string[];
  env?: Record<string, string>;
  autorestart?: boolean;
  watch?: boolean | string[];
}

export interface TSPMConfig {
  processes: ProcessConfig[];
}

export class ConfigLoader {
  static async load(path: string): Promise<TSPMConfig> {
    const configFile = file(path);
    if (!(await configFile.exists())) {
      throw new Error(`Config file not found: ${path}`);
    }

    const content = await configFile.text();

    if (path.endsWith(".yaml") || path.endsWith(".yml")) {
      // @ts-ignore - Bun.YAML might not be in the current types yet but it exists in Bun
      return Bun.YAML.parse(content) as TSPMConfig;
    }

    if (path.endsWith(".jsonc")) {
      // @ts-ignore - Bun.JSONC might not be in the current types yet but it exists in Bun
      return Bun.JSONC.parse(content) as TSPMConfig;
    }

    return JSON.parse(content) as TSPMConfig;
  }
}
