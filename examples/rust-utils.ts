
import { spawnSync } from "bun";
import path from "path";

/**
 * Common utilities for Rust examples
 */

// Configuration constants
export const RUST_PROJECT_DIR = "examples/applications/rust-crash";
export const BINARY_REL_PATH = "target/release/rust-crash-app";

/**
 * Helper to build the Rust application locally
 */
export function buildRustApp(): boolean {
    console.log("🛠️  Compiling Rust application...");
    
    // Check for cargo availability
    try {
        const check = spawnSync(["cargo", "--version"]);
        if (check.exitCode !== 0) throw new Error("Cargo not found");
    } catch {
        console.error("❌ Cargo (Rust package manager) not found. Please install Rust to run this example.");
        return false;
    }

    const rustProject = path.join(process.cwd(), RUST_PROJECT_DIR);
    
    // Build release binary
    const build = spawnSync(["cargo", "build", "--release"], {
        cwd: rustProject,
        stdio: ["ignore", "inherit", "inherit"]
    });

    if (build.exitCode !== 0) {
        console.error("❌ Failed to build Rust application. Check compiler output above.");
        return false;
    }

    console.log("✅ Rust application built successfully.");
    return true;
}
