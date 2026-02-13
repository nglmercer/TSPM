import { describe, expect, it, afterEach, beforeEach } from "bun:test";
import { ManagedProcess } from "../../src/core/ManagedProcess";
import type { ProcessConfig } from "../../src/core/types";
import { join } from "node:path";
import { unlinkSync, existsSync, writeFileSync } from "node:fs";

describe("ManagedProcess Hooks", () => {
  const testDir = join(process.cwd(), "temp_test_hooks");
  
  beforeEach(async () => {
    if (!existsSync(testDir)) {
      const { mkdir } = await import("node:fs/promises");
      await mkdir(testDir, { recursive: true });
    }
  });

  afterEach(async () => {
    // Cleanup
    const { rm } = await import("node:fs/promises");
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  it("should load environment variables from dotEnv file", async () => {
    const dotEnvPath = join(testDir, ".env.test");
    writeFileSync(dotEnvPath, "TEST_VAR=hello_world\nOTHER_VAR='quoted value'\nNUM_VAR=123");

    const config: ProcessConfig = {
      name: "test-env",
      script: "sh",
      args: ["-c", "echo $TEST_VAR $OTHER_VAR $NUM_VAR"],
      dotEnv: dotEnvPath,
      stdout: join(testDir, "out.log"),
    };

    const process = new ManagedProcess(config);
    await process.start();
    
    // Give it a moment to run
    await new Promise(resolve => setTimeout(resolve, 500));
    process.stop();

    const output = await Bun.file(join(testDir, "out.log")).text();
    expect(output).toContain("hello_world quoted value 123");
  });

  it("should run preStart script before starting the process", async () => {
    const preStartPath = join(testDir, "pre.log");
    const config: ProcessConfig = {
      name: "test-prestart",
      script: "sh",
      args: ["-c", "echo running"],
      preStart: `echo prestart_done > ${preStartPath}`,
      stdout: join(testDir, "out.log"),
    };

    const process = new ManagedProcess(config);
    await process.start();
    
    await new Promise(resolve => setTimeout(resolve, 500));
    process.stop();

    const preContent = await Bun.file(preStartPath).text();
    expect(preContent.trim()).toBe("prestart_done");
  });

  it("should run postStart script after starting the process", async () => {
    const postStartPath = join(testDir, "post.log");
    const config: ProcessConfig = {
      name: "test-poststart",
      script: "sh",
      args: ["-c", "sleep 1"],
      postStart: `echo poststart_done > ${postStartPath}`,
    };

    const process = new ManagedProcess(config);
    await process.start();
    
    // postStart runs in background after start() returns
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (existsSync(postStartPath)) {
        const postContent = await Bun.file(postStartPath).text();
        expect(postContent.trim()).toBe("poststart_done");
    } else {
        // Wait a bit more if needed
        await new Promise(resolve => setTimeout(resolve, 500));
        const postContent = await Bun.file(postStartPath).text();
        expect(postContent.trim()).toBe("poststart_done");
    }
    
    process.stop();
  });
});
