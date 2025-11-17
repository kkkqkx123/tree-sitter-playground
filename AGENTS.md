# AGENTS.md - Development Guide

## Build/Lint/Test Commands

- **Compile**: `npm run compile` (webpack build)
- **Watch**: `npm run watch` (webpack in watch mode)
- **Package**: `npm run package` (production build with source maps)
- **Lint**: `npm run lint` (eslint check)
- **Build WASM**: `npm run build-wasm` (compile tree-sitter WASM)
- **Compile Tests**: `npm run compile-tests` (tsc tests)
- **Watch Tests**: `npm run watch-tests` (tsc tests in watch mode)
- **Full Test**: `npm run pretest` (compile-tests + compile + lint)

## Architecture & Structure

- **Extension Type**: VS Code extension (with web support)
- **Main Entry**: `src/extension.ts` (activates on TypeScript, JSON, `.tsqnb` files)
- **Key Components**:
  - `controller.ts` - Notebook controller logic
  - `treeSitter.ts` - Tree-sitter parser initialization
  - `serializer.ts` - Notebook document serialization
  - `queryDiagnosticsProvider.ts` - Query validation
  - `renderer/` - Notebook output renderer
  - `util/` - Utilities and vendor code
- **Supported Languages**: JavaScript, TypeScript, Python, Java, Go, C#, C++, Rust, Ruby
- **Build Tool**: Webpack + ts-loader
- **WASM**: Tree-sitter WASM file at `src/.wasm/tree-sitter.wasm`

## Code Style & Conventions

- **Language**: TypeScript (strict mode enabled)
- **Target**: ES2022, Node16 modules
- **Naming**: camelCase for variables/functions, PascalCase for imports/classes
- **Semicolons**: Required (enforced by eslint)
- **Imports**: Use `import` statements, follow naming convention in eslint config
- **Error Handling**: No throw literals, use proper Error objects
- **Linting**: ESLint with `@typescript-eslint` parser
