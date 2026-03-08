
import { $ } from "bun";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

// Detect OS and Arch
const os = process.platform;
const arch = process.arch;

const validOS = ['linux', 'darwin', 'win32'];

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
const cliOutputName = `tspm-${targetOS}-${targetArch}${extension}`;
const cliOutputPath = join(outputDir, cliOutputName);

console.log(`Building for ${targetOS} (${targetArch})...`);

// Ensure dist directory exists
await mkdir(outputDir, { recursive: true });

// Clean previous builds
try {
  await rm(join(outputDir, "index.js"), { force: true });
  await rm(join(outputDir, "index.cjs"), { force: true });
  await rm(join(outputDir, "cli"), { force: true, recursive: true });
  await rm(join(outputDir, "core"), { force: true, recursive: true });
  await rm(join(outputDir, "utils"), { force: true, recursive: true });
} catch {}

try {
  // Build 1: Standalone CLI executable using bun build CLI
  console.log('\n📦 Building standalone CLI executable...');
  await $`bun build --compile --minify --sourcemap ./src/cli/index.ts --outfile ${cliOutputPath}`;
  console.log(`✅ CLI build successful: ${cliOutputPath}`);

  // Build 2: ESM module bundle using bun build CLI
  console.log('\n📦 Building ESM module...');
  await $`bun build ./index.ts --outdir ${outputDir} --format esm --target bun`;
  console.log(`✅ ESM build successful: ${outputDir}/index.js`);

  // Build 3: CJS module bundle using bun build CLI
  console.log('\n📦 Building CJS module...');
  await $`bun build ./index.ts --outfile ${join(outputDir, 'index.cjs')} --format cjs --target bun`;
  console.log(`✅ CJS build successful: ${outputDir}/index.cjs`);

  // Copy package.json to dist
  console.log('\n📦 Copying package.json...');
  await $`cp package.json ${join(outputDir, 'package.json')}`;

  // Build Web Dashboard using Bun's native HTML bundler
  console.log('\n📦 Building Web Dashboard...');
  await $`bun build src/web/public/index.html --minify --outdir ${join(outputDir, 'public')}`;
  console.log(`✅ Web Dashboard build successful: ${outputDir}/public`);

  console.log(`\n🎉 Build completed successfully!`);
  console.log(`   - CLI: ${cliOutputPath}`);
  console.log(`   - ESM: ${outputDir}/index.js`);
  console.log(`   - CJS: ${outputDir}/index.cjs`);
  
} catch (error) {
  console.error(`❌ Build failed:`, error);
  process.exit(1);
}
