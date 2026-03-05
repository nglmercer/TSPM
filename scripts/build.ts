
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
  // Build the CLI as a standalone executable
  await $`bun build --compile --minify --sourcemap ./src/cli/index.ts --outfile ${outputPath}`;
  console.log(`✅ CLI build successful: ${outputPath}`);
  
  // Build the main package for Bun (since the project uses Bun APIs)
  await $`bun build ./index.ts --outdir ${outputDir} --format esm --target bun`;
  console.log(`✅ ESM build successful: ${outputDir}/index.js`);
  
  // Also build CommonJS version
  await $`bun build ./index.ts --outdir ${outputDir} --format cjs --target bun`;
  console.log(`✅ CJS build successful: ${outputDir}/index.cjs`);
  
  // Copy package.json to dist for npm publishing
  await $`cp package.json ${outputDir}/package.json`;
  console.log(`✅ package.json copied to dist`);
  
  // Generate declaration files using tsc
  try {
    await $`tsc --emitDeclarationOnly --declaration --outDir ${outputDir} --project tsconfig.build.json 2>/dev/null || echo "Type declarations skipped (tsconfig.build.json not found)"`;
  } catch {
    console.log("⚠️ Type declarations generation skipped");
  }
  
  console.log(`\n🎉 Build completed successfully!`);
  console.log(`   - CLI: ${outputPath}`);
  console.log(`   - ESM: ${outputDir}/index.js`);
  console.log(`   - CJS: ${outputDir}/index.cjs`);
  
} catch (error) {
  console.error(`❌ Build failed:`, error);
  process.exit(1);
}
