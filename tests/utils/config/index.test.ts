import { expect, test, describe, afterAll } from "bun:test";
import { 
  detectConfigFormat, 
  readConfigFile, 
  writeConfigFile 
} from "../../../src/utils/config/index";
import { unlink } from "node:fs/promises";

describe("Main Config Utils", () => {
  const jsonPath = "test_main.json";
  const yamlPath = "test_main.yaml";

  afterAll(async () => {
    try {
      await unlink(jsonPath);
      await unlink(yamlPath);
    } catch {
      // Ignore
    }
  });

  test("detectConfigFormat should detect formats correctly", () => {
    expect(detectConfigFormat("config.json")).toBe("json");
    expect(detectConfigFormat("config.JSON")).toBe("json");
    expect(detectConfigFormat("config.jsonc")).toBe("jsonc");
    expect(detectConfigFormat("config.yaml")).toBe("yaml");
    expect(detectConfigFormat("config.yml")).toBe("yml");
    expect(detectConfigFormat("config.txt")).toBeNull();
  });

  test("readConfigFile and writeConfigFile should work for JSON", async () => {
    const data = { type: "json" };
    await writeConfigFile(jsonPath, data);
    const read = await readConfigFile<{ type: string }>(jsonPath);
    expect(read).toEqual(data);
  });

  test("readConfigFile and writeConfigFile should work for YAML", async () => {
    const data = { type: "yaml" };
    await writeConfigFile(yamlPath, data);
    const read = await readConfigFile<{ type: string }>(yamlPath);
    expect(read).toEqual(data);
  });

  test("readConfigFile should throw on unsupported extension", async () => {
    await expect(readConfigFile("config.txt")).rejects.toThrow("Unsupported config format");
  });
});
