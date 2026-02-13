
# Build targets
.PHONY: build clean

# Run the TypeScript build script
build:
	bun scripts/build.ts

# Clean artifacts
clean:
	rm -rf dist
