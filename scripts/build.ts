
import { $ } from "bun";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

// Detect OS and Arch
const os = process.platform;
const arch = process.arch;

const validOS = ['linux', 'darwin', 'win32'];
const validArch = ['x64', 'arm64'];

if (!validOS.includes(os)) {
  console.error(`Unsupported OS: ${os}`);
  process.exit(1);
}

// Map node platform names to more common names
const osMap: Record<string, string> = {
  'linux': 'linux',
  'darwin': 'macos',
  'win32': 'windows'
};

const archMap: Record<string, string> = {
  'x64': 'x64',
  'arm64': 'arm64'
};


const targetOS = osMap[os];
const targetArch = archMap[arch] || arch;
const extension = os === 'win32' ? '.exe' : '';

const outputDir = "dist";
const outputName = `tspm-${targetOS}-${targetArch}${extension}`;
const outputPath = join(outputDir, outputName);

console.log(`Building for ${targetOS} (${targetArch})...`);

// Ensure dist directory exists
await mkdir(outputDir, { recursive: true });

try {
  // Run bun build
  // utilizing Bun Shell for better command execution
  await $`bun build --compile --minify --sourcemap ./src/cli/index.ts --outfile ${outputPath}`;
  
  console.log(`✅ Build successful: ${outputPath}`);
  
} catch (error) {
  console.error(`❌ Build failed:`, error);
  process.exit(1);
}
