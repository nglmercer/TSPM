import { expect, test, describe, afterAll } from "bun:test";
import { 
  parseJsonString, 
  parseJsonStringSafe, 
  mergeJsonConfigs, 
  isJsoncContent, 
  stripJsoncComments,
  writeJsonFile,
  readJsonFile
} from "../../../src/utils/config/json";
import { unlink } from "node:fs/promises";

describe("JSON/JSONC Utils", () => {
  const testFilePath = "test_config.json";

  afterAll(async () => {
    try {
      await unlink(testFilePath);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  test("parseJsonString should parse valid JSON", () => {
    const json = '{"key": "value", "number": 123}';
    const result = parseJsonString<{ key: string; number: number }>(json);
    expect(result.key).toBe("value");
    expect(result.number).toBe(123);
  });

  test("parseJsonString should parse JSONC (comments)", () => {
    const jsonc = `{
      // This is a comment
      "key": "value" /* and another */
    }`;
    const result = parseJsonString<{ key: string }>(jsonc);
    expect(result.key).toBe("value");
  });

  test("parseJsonStringSafe should handle valid JSON", () => {
    const json = '{"key": "value"}';
    const result = parseJsonStringSafe<{ key: string }>(json);
    expect(result.success).toBe(true);
    expect(result.data?.key).toBe("value");
    expect(result.error).toBeNull();
  });

  test("parseJsonStringSafe should handle invalid JSON", () => {
    const json = '{"key": "value"'; // Missing closing brace
    const result = parseJsonStringSafe(json);
    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
  });

  test("mergeJsonConfigs should deep merge objects", () => {
    const base = { a: 1, b: { c: 2 } } as any;
    const override = { b: { d: 3 }, e: 4 } as any;
    const result = mergeJsonConfigs(base, override);
    
    expect(result).toEqual({
      a: 1,
      b: { c: 2, d: 3 },
      e: 4
    } as any);
  });

  test("isJsoncContent should detect comments and trailing commas", () => {
    expect(isJsoncContent('{"a":1 // comment\n}')).toBe(true);
    expect(isJsoncContent('{"a":1 /* comment */}')).toBe(true);
    expect(isJsoncContent('{"a":1,}')).toBe(true);
    expect(isJsoncContent('{"a":1}')).toBe(false);
  });

  test("stripJsoncComments should remove comments", () => {
    const jsonc = '{"a":1 // comment\n, "b":2}';
    const stripped = stripJsoncComments(jsonc);
    // Should be valid JSON now
    expect(() => JSON.parse(stripped)).not.toThrow();
    const parsed = JSON.parse(stripped);
    expect(parsed.a).toBe(1);
    expect(parsed.b).toBe(2);
  });

  test("writeJsonFile and readJsonFile", async () => {
    const data = { test: "data", value: 42 };
    await writeJsonFile(testFilePath, data);
    
    const read = await readJsonFile<{ test: string; value: number }>(testFilePath);
    expect(read).toEqual(data);
  });
});
