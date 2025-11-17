# Windows环境下的构建问题解决方案

## 问题描述

在Windows环境下执行 `npm run build-wasm` 时出现以下错误：

```
D:\ide\tool\代码库索引\tree-sitter-queries\vscode-tree-sitter-query\node_modules\.bin\tree-sitter:2
basedir=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")
          ^^^^^^^

SyntaxError: missing ) after argument list
```

或者

```
error: unrecognized subcommand 'build-wasm'
```

## 问题原因

1. **原始问题**：在Windows环境下，`node_modules/.bin/tree-sitter` 是一个Unix shell脚本，使用了Unix shell语法（如`$(dirname ...)`），这在Windows的PowerShell或CMD中无法执行。

2. **命令问题**：`tree-sitter` CLI 的正确命令是 `build --wasm --docker` 而不是 `build-wasm --docker`。

## 解决方案

### 1. 修改 compileWasm.ts 文件

已更新 `src/compileWasm.ts` 文件，使其能够检测操作系统并使用适当的命令：

```typescript
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ... 其他代码

export async function ensureWasm(grammar: ITreeSitterGrammar, outputPath: string): Promise<void> {
    console.log(`Building ${grammar.name}!`);
    const folderPath = path.join(path.resolve(PROJECT_ROOT, '..'), 'node_modules', grammar.projectPath || grammar.name);

    // Create .build folder if it doesn't exist
    await fs.promises.mkdir(outputPath, { recursive: true });

    // Determine the correct path for tree-sitter binary based on OS
    // On Windows, npm creates .cmd files; on Unix, it creates shell scripts
    const isWindows = os.platform() === 'win32';
    const treeSitterCmd = isWindows ? 'tree-sitter.cmd' : 'tree-sitter';
    
    // Use cross-platform command execution - use correct command: build --wasm --docker
    const command = `${treeSitterCmd} build --wasm --docker "${folderPath}"`;
    
    console.log(`Executing: ${command}`);
    
    // Execute with appropriate shell for the platform
    if (isWindows) {
        // On Windows, use the system shell to handle .cmd files properly
        child_process.execSync(command, {
            stdio: 'inherit',
            cwd: path.resolve(PROJECT_ROOT, '..'), // Execute from project root
            encoding: 'utf8',
            shell: process.env.comspec || 'cmd.exe' // Use Windows command processor
        });
    } else {
        // On Unix systems, execute directly or use bash
        child_process.execSync(command, {
            stdio: 'inherit',
            cwd: path.resolve(PROJECT_ROOT, '..'), // Execute from project root
            encoding: 'utf8',
            shell: '/bin/sh' // Use standard shell on Unix
        });
    }

    // Rename to a consistent name if necessary
    if (grammar.filename) {
        const sourceName = grammar.filename;
        const targetName = `${grammar.name}.wasm`;
        const sourcePath = path.join(outputPath, sourceName);
        const targetPath = path.join(outputPath, targetName);
        
        // Check if source file exists with the expected name
        try {
            await fs.promises.access(sourcePath);
            await fs.promises.rename(sourcePath, targetPath);
        } catch {
            // If the expected name doesn't exist, try to find the actual generated file
            // It might be generated with the default name
            const defaultName = `${grammar.name.replace('tree-sitter-', '')}.wasm`;
            const defaultPath = path.join(outputPath, defaultName);
            try {
                await fs.promises.access(defaultPath);
                await fs.promises.rename(defaultPath, targetPath);
            } catch {
                // If neither expected name exists, try to find any .wasm file in the output directory
                const files = await fs.promises.readdir(outputPath);
                const wasmFile = files.find(file => file.endsWith('.wasm') && file.includes(grammar.name.replace('tree-sitter-', '')));
                if (wasmFile) {
                    const foundPath = path.join(outputPath, wasmFile);
                    await fs.promises.rename(foundPath, targetPath);
                }
            }
        }
    }
}
```

### 2. 关键修改点

1. **操作系统检测**：使用 `os.platform()` 检测当前操作系统
2. **命令名称调整**：在Windows上使用 `tree-sitter.cmd`，在Unix系统上使用 `tree-sitter`
3. **正确命令**：使用 `build --wasm --docker` 而不是 `build-wasm --docker`
4. **Shell选项**：为不同平台指定适当的shell（Windows使用`cmd.exe`，Unix使用`/bin/sh`）
5. **错误处理增强**：改进了文件重命名的错误处理逻辑

### 3. 替代方案

如果仍然遇到问题，可以尝试以下替代方案：

#### 方案A：使用npx
修改 `package.json` 中的构建脚本：
```json
{
  "scripts": {
    "build-wasm": "npx tree-sitter build --wasm --docker node_modules/tree-sitter-c-sharp && cp node_modules/web-tree-sitter/tree-sitter.wasm src/.wasm/"
  }
}
```

#### 方案B：使用cross-env
安装 `cross-env` 包来处理跨平台环境变量：
```bash
npm install --save-dev cross-env
```

然后修改 `package.json`：
```json
{
  "scripts": {
    "build-wasm": "cross-env-shell \"ts-node src/buildWasm.ts && cp node_modules/web-tree-sitter/tree-sitter.wasm src/.wasm/\""
  }
}
```

#### 方案C：使用PowerShell脚本
创建 `build-wasm.ps1` PowerShell脚本：
```powershell
# build-wasm.ps1
Write-Host "Building WASM files..."

# Build each grammar
npx tree-sitter build --wasm --docker node_modules/tree-sitter-c-sharp
npx tree-sitter build --wasm --docker node_modules/tree-sitter-cpp
npx tree-sitter build --wasm --docker node_modules/tree-sitter-go
npx tree-sitter build --wasm --docker node_modules/tree-sitter-javascript
npx tree-sitter build --wasm --docker node_modules/tree-sitter-python
npx tree-sitter build --wasm --docker node_modules/tree-sitter-ruby
npx tree-sitter build --wasm --docker node_modules/tree-sitter-typescript/typescript
npx tree-sitter build --wasm --docker node_modules/tree-sitter-typescript/tsx
npx tree-sitter build --wasm --docker node_modules/tree-sitter-java
npx tree-sitter build --wasm --docker node_modules/tree-sitter-rust

# Copy the main WASM file
Copy-Item node_modules/web-tree-sitter/tree-sitter.wasm src/.wasm/ -Force

Write-Host "Build completed!"
```

### 4. 验证修复

执行以下命令验证修复是否成功：
```bash
npm run build-wasm
```

如果成功，将在 `src/.wasm/` 目录下生成所需的WASM文件。

## 注意事项

1. **Docker要求**：`tree-sitter build --wasm --docker` 命令需要Docker运行时
2. **网络连接**：构建过程可能需要下载Docker镜像
3. **权限问题**：确保有足够的权限执行构建命令

## 其他Windows兼容性问题

### 1. 路径分隔符问题
在Windows上，路径分隔符是反斜杠 `\`，而在Unix系统上是正斜杠 `/`。代码中使用了 `path.join()` 来确保跨平台兼容性。

### 2. 文件权限
Windows没有Unix风格的文件权限概念，因此在处理文件操作时需要注意。

### 3. 行结束符
Windows使用 `\r\n` 作为行结束符，而Unix使用 `\n`。在处理文本文件时需要注意。

通过以上修改，现在该扩展应该能够在Windows环境下正常构建WASM文件了。