import { expect, test, describe, afterAll } from "bun:test";
import { 
  parseYamlString, 
  parseYamlStringSafe, 
  mergeYamlConfigs,
  writeYamlFile,
  readYamlFile
} from "../../../src/utils/config/yaml";
import { unlink } from "node:fs/promises";

describe("YAML Utils", () => {
  const testFilePath = "test_config.yaml";

  afterAll(async () => {
    try {
      await unlink(testFilePath);
    } catch {
      // Ignore
    }
  });

  test("parseYamlString should parse valid YAML", () => {
    const yaml = "key: value\nnumber: 123";
    const result = parseYamlString<{ key: string; number: number }>(yaml);
    expect(result.key).toBe("value");
    expect(result.number).toBe(123);
  });

  test("parseYamlStringSafe should handle valid YAML", () => {
    const yaml = "key: value";
    const result = parseYamlStringSafe<{ key: string }>(yaml);
    expect(result.success).toBe(true);
    expect(result.data?.key).toBe("value");
  });

  test("mergeYamlConfigs should deep merge objects", () => {
    const base: Record<string, unknown> = { a: 1, b: { c: 2 } };
    const override: Record<string, unknown> = { b: { d: 3 }, e: 4 };
    const result = mergeYamlConfigs(base, override);
    
    expect(result).toEqual({
      a: 1,
      b: { c: 2, d: 3 },
      e: 4
    });
  });

  test("writeYamlFile and readYamlFile", async () => {
    const data = { test: "yaml", value: 100 };
    await writeYamlFile(testFilePath, data);
    
    const read = await readYamlFile<{ test: string; value: number }>(testFilePath);
    expect(read).toEqual(data);
  });
});
