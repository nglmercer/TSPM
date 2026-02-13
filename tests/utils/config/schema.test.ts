import { expect, test, describe } from "bun:test";
import { validateConfig, validateProcessConfig } from "../../../src/utils/config/schema";

describe("Config Schema (ArkType)", () => {
  describe("validateProcessConfig", () => {
    test("should validate a valid process config", () => {
      const config = {
        name: "test-app",
        script: "app.ts"
      };
      const errors = validateProcessConfig(config);
      expect(errors).toHaveLength(0);
    });

    test("should return error for missing name", () => {
      const config = {
        script: "app.ts"
      };
      const errors = validateProcessConfig(config);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("process.name");
    });

    test("should return error for invalid type", () => {
      const config = {
        name: "test-app",
        script: 123
      };
      // @ts-ignore
      const errors = validateProcessConfig(config);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("must be a string");
    });

    test("should return error for empty name", () => {
      const config = {
        name: "",
        script: "app.ts"
      };
      const errors = validateProcessConfig(config);
      expect(errors).toHaveLength(1);
    });
  });

  describe("validateConfig", () => {
    test("should validate a full valid config", () => {
      const config = {
        processes: [
          { name: "app1", script: "start.ts" },
          { name: "app2", script: "start.ts" }
        ],
        logDir: "logs"
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("should fail on duplicate process names", () => {
      const config = {
        processes: [
          { name: "app1", script: "start.ts" },
          { name: "app1", script: "start.ts" }
        ]
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("Duplicate process name");
    });

    test("should fail on missing processes array", () => {
      const config = {
        logDir: "logs"
      };
      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === "processes")).toBe(true);
    });
  });
});
