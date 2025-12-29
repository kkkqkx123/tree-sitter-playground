# VS Code Tree-sitter Playground Extension

## Language

Always use simplified Chinese in comments and docs.

## Project Overview

This is a VS Code extension called "vscode-tree-sitter-playground" that provides tools for working with Tree-sitter, a parser generator tool and incremental parsing library. The extension adds syntax highlighting and language configuration for the Tree-sitter query language and provides a notebook interface for running Tree-sitter queries against source code.

### Key Features

1. **Tree-sitter Query Language Support**: Provides syntax highlighting for Tree-sitter query files (.scm extension) with support for comments, fields, captures, and nodes.

2. **Tree-sitter Notebook**: A specialized notebook environment (with .tsqnb files) that allows users to:
   - Add source code cells in various supported languages (JavaScript, Python, C++, C#, Go, Ruby, Java, Rust, TypeScript, TSX)
   - Add Tree-sitter query cells to match patterns in the source code
   - Execute queries and see parse tree results and matches

3. **Parse Tree Visualization**: Visualizes the parse tree of source code with clickable nodes that can highlight corresponding code in the editor.

4. **Query Diagnostics**: Provides diagnostics for Tree-sitter query files to help with debugging.

5. **Cross-platform Support**: Works in both Node.js and web environments using WebAssembly.

### Architecture

- **Extension Entry Point**: `src/extension.ts` - Initializes the extension, registers the notebook serializer, and sets up the controller
- **Notebook Controller**: `src/controller.ts` - Handles execution of notebook cells, parses source code, and runs Tree-sitter queries
- **Syntax Highlighting**: Defined in `syntaxes/scm.tmLanguage.json` for the Tree-sitter query language
- **Renderer**: `src/renderer/tree-sitter-renderer.ts` - Renders notebook outputs in the UI
- **WASM Integration**: Uses WebAssembly to run Tree-sitter parsers in the browser and Node.js environments

## Building and Running

### Prerequisites
- Node.js (version compatible with package.json engines)
- npm or yarn

### Build Commands
- `npm install` - Install dependencies
- `npm run compile` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and compile incrementally
- `npm run build-wasm` - Build WASM files for Tree-sitter parsers
- `npm run package` - Package the extension for production
- `npm run lint` - Run ESLint to check code quality

### Development Setup
1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to compile the extension
4. Open the project in VS Code and press F5 to launch a new window with the extension loaded

## Development Conventions

### Code Structure
- `src/` - Main source code
- `src/renderer/` - Notebook renderer code
- `src/test/` - Test files
- `syntaxes/` - TextMate grammar for syntax highlighting
- `test-workspace/` - Test workspace files

### Supported Languages
The extension supports Tree-sitter parsing for the following languages:
- JavaScript/TypeScript
- Python
- C++
- C#
- Go
- Ruby
- Java
- Rust

### File Types
- `.scm` - Tree-sitter query files
- `.tsqnb` - Tree-sitter notebook files
- `.wasm` - WebAssembly files for Tree-sitter parsers

### Testing
- The extension includes test notebooks (`.tsqnb` files) for various scenarios
- Tests can be run using the commands defined in package.json

## Usage

### Creating a Tree-sitter Notebook
1. In VS Code, go to File > New File > Tree-sitter Notebook
2. Add a source code cell with code in one of the supported languages
3. Add a Tree-sitter query cell with your query pattern
4. Run the notebook to see the parse tree and query results

### Example Query
```
(identifier) @variable
```
This query would match all identifiers in the source code and capture them as `@variable`.

### Working with Parse Trees
The extension provides a command "Open Parse Tree View to Side" that allows you to visualize the parse tree of any supported language file.