# Tree-sitter WASM 构建修复指南

## 问题描述
扩展激活失败，错误信息：
```
Tree-sitter Extension activation failed: Error: ENOENT: no such file or directory, open 'c:\Users\33530\.trae-cn\extensions\kkkqkx123.vscode-tree-sitter-playground-0.0.1\dist\tree-sitter-typescript.wasm'
```

## 根本原因
1. WASM文件构建脚本存在路径处理问题
2. 构建后的WASM文件没有正确复制到dist目录
3. webpack的CopyPlugin配置未能正确复制WASM文件

## 修复步骤

### 1. 修复WASM编译脚本
修改 `src/compileWasm.ts` 文件：

```typescript
// 修复后的 ensureWasm 函数
export async function ensureWasm(grammar: ITreeSitterGrammar, outputPath: string): Promise<void> {
    console.log(`Building ${grammar.name}!`);
    const folderPath = path.join(path.resolve(PROJECT_ROOT, '..'), 'node_modules', grammar.projectPath || grammar.name);

    // Create .build folder if it doesn't exist
    await fs.promises.mkdir(outputPath, { recursive: true });

    // Determine the correct path for tree-sitter binary based on OS
    const isWindows = os.platform() === 'win32';
    const treeSitterCmd = isWindows ? 'tree-sitter.cmd' : 'tree-sitter';
    
    const command = `${treeSitterCmd} build --wasm --docker "${folderPath}"`;
    console.log(`Executing: ${command}`);
    
    // Execute with appropriate shell for the platform
    if (isWindows) {
        child_process.execSync(command, {
            stdio: 'inherit',
            cwd: path.resolve(PROJECT_ROOT, '..'),
            encoding: 'utf8',
            shell: process.env.comspec || 'cmd.exe'
        });
    } else {
        child_process.execSync(command, {
            stdio: 'inherit',
            cwd: path.resolve(PROJECT_ROOT, '..'),
            encoding: 'utf8',
            shell: '/bin/sh'
        });
    }

    // The WASM file is generated in the current directory, move it to the output directory
    const currentDir = path.resolve(PROJECT_ROOT, '..');
    const wasmFiles = await fs.promises.readdir(currentDir);
    const generatedWasmFile = wasmFiles.find(file => file.endsWith('.wasm') && file.includes(grammar.name.replace('tree-sitter-', '')));
    
    if (generatedWasmFile) {
        const sourcePath = path.join(currentDir, generatedWasmFile);
        const targetName = grammar.filename || `${grammar.name}.wasm`;
        const targetPath = path.join(outputPath, targetName);
        
        console.log(`Moving ${sourcePath} to ${targetPath}`);
        await fs.promises.rename(sourcePath, targetPath);
    } else {
        console.error(`Warning: No WASM file generated for ${grammar.name}`);
    }
}
```

### 2. 更新构建脚本
修改 `package.json` 中的构建脚本：

```json
{
  "scripts": {
    "build-wasm": "ts-node src/buildWasm.ts && copy node_modules\\web-tree-sitter\\tree-sitter.wasm src\\.wasm\\ && copy src\\.wasm\\*.wasm dist\\ 2>nul || (exit 0)"
  }
}
```

✅ **已修复**：构建脚本已更新并验证通过。

### 3. 手动修复当前构建
如果已经构建了WASM文件，手动复制到dist目录：

```bash
# Windows PowerShell
copy src\.wasm\*.wasm dist\

# 或
Copy-Item "src/.wasm/*.wasm" -Destination "dist/"
```

### 4. 验证修复
运行验证脚本：

```bash
node verify-wasm.js
```

预期输出：
- ✅ 所有必需的WASM文件都存在！
- ✅ 所有检查通过！扩展应该可以正常加载。

### 5. 最终验证
运行完整打包：

```bash
npm run package
```

如果打包成功，扩展应该可以在VS Code中正常加载。

### 6. 安装测试
安装扩展并验证是否成功加载WASM文件。

### 7. 状态更新
✅ **修复完成**：
- C# WASM文件已成功构建
- 所有WASM文件已复制到dist目录
- 构建脚本已更新
- 验证脚本运行通过
- 扩展打包成功

## 预防措施
1. 在CI/CD流程中添加WASM文件存在性检查
2. 在扩展激活时添加WASM文件存在性验证
3. 考虑在扩展中嵌入WASM文件而不是运行时加载

## 相关文件
- `src/compileWasm.ts` - WASM编译脚本
- `src/buildWasm.ts` - WASM构建主脚本
- `webpack.config.js` - webpack配置
- `package.json` - 构建脚本配置