import { expect, it, describe, beforeAll, afterAll } from "bun:test";
import { ManagedProcess } from "../../src/core/ManagedProcess";
import type { ProcessConfig } from "../../src/core/types";
import { rm, mkdir, writeFile } from "node:fs/promises";
import { join } from "path";
import { EventEmitter } from "../../src/utils/events";

const TEST_DIR = join(process.cwd(), "temp_test_extra");

describe("ManagedProcess Extra Features", () => {
  beforeAll(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterAll(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it("should restart when a watched file changes", async () => {
    const scriptPath = join(TEST_DIR, "watch-target.ts");
    await writeFile(scriptPath, "console.log('original');");

    const config: ProcessConfig = {
      name: "test-watch",
      script: scriptPath,
      watch: true,
      cwd: TEST_DIR,
      autorestart: false,
    };

    const emitter = new EventEmitter();
    const process = new ManagedProcess(config, 0, emitter);

    let restartCount = 0;
    emitter.on("process:restart", () => {
      restartCount++;
    });

    await process.start();
    
    // Wait for process to start
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Trigger change
    await writeFile(scriptPath, "console.log('changed');");
    
    // Wait for watcher to detect and restart (debounce is 100ms)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    process.stop();
    expect(restartCount).toBeGreaterThan(0);
  });

  it("should emit log events", async () => {
    const scriptPath = join(TEST_DIR, "log-emitter.ts");
    await writeFile(scriptPath, "process.stdout.write('hello log');");

    const config: ProcessConfig = {
      name: "test-logs",
      script: scriptPath,
      stdout: join(TEST_DIR, "out.log"),
      autorestart: false,
    };

    const emitter = new EventEmitter();
    const process = new ManagedProcess(config, 0, emitter);

    let loggedMessage = "";
    emitter.on("process:log", (event: any) => {
      loggedMessage += event.data.message;
    });

    await process.start();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    process.stop();
    expect(loggedMessage).toContain("hello log");
  });
});
