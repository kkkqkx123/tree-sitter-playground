# VSCode Tree-Sitter Query 插件构建与安装指南

## 概述

本文档详细说明如何构建VSCode Tree-Sitter Query插件的vsix安装包，并将其安装到VSCode中。

## 项目结构

```
vscode-tree-sitter-query/
├── package.json              # 插件清单文件
├── webpack.config.js         # Webpack打包配置
├── .vscodeignore              # 打包忽略文件配置
├── src/                       # 源代码目录
│   ├── extension.ts          # 主扩展入口
│   ├── renderer/             # Notebook渲染器
│   └── ...
├── dist/                      # 构建输出目录
└── docs/                      # 文档目录
```

## 构建要求

### 系统要求
- Node.js (推荐版本 16+)
- npm 或 yarn
- VSCode (版本 ^1.84.0)

### 依赖项
项目使用以下主要构建工具：
- **@vscode/vsce**: VSCode扩展命令行工具
- **webpack**: 模块打包工具
- **typescript**: TypeScript编译器
- **ts-node**: TypeScript执行环境

## 构建流程

### 步骤1: 环境准备

```bash
# 克隆项目
git clone https://github.com/jrieken/vscode-tree-sitter-query.git
cd vscode-tree-sitter-query

# 安装依赖
npm install
```

### 步骤2: Windows系统兼容性修复

**重要**: 在Windows系统上构建需要修复文件复制命令。

**问题**: `build-wasm`脚本使用了Unix的`cp`命令，在Windows PowerShell中不可用。

**解决方案**: 修改`package.json`中的`build-wasm`脚本：

```json
// 原始Unix命令（不适用于Windows）
"build-wasm": "ts-node src/buildWasm.ts && cp node_modules/web-tree-sitter/tree-sitter.wasm src/.wasm/"

// 修改为Windows兼容命令
"build-wasm": "ts-node src/buildWasm.ts && copy node_modules\\web-tree-sitter\\tree-sitter.wasm src\\.wasm\\"
```

**注意**: 路径分隔符也需要从`/`改为`\\`。

### 步骤3: 执行构建

项目提供了完整的构建脚本：

```bash
# 完整构建（推荐）
npm run package

# 或者分步构建
npm run build-wasm      # 构建WebAssembly文件
npm run compile         # TypeScript编译
webpack --mode production --devtool hidden-source-map
```

**构建过程详解**：

1. **build-wasm阶段**:
   ```bash
   ts-node src/buildWasm.ts && copy node_modules\web-tree-sitter\tree-sitter.wasm src\.wasm\
   ```
   - 编译Tree-Sitter的WebAssembly文件（支持多种编程语言）
   - 复制必要的wasm文件到构建目录
   - **Windows兼容性**: 使用`copy`命令替代Unix的`cp`命令

2. **webpack打包阶段**:
   - 生成`dist/extension.js` (Node.js环境)
   - 生成`dist/web/extension.js` (Web环境)  
   - 生成`dist/renderer.js` (Notebook渲染器)

### 步骤4: 生成vsix包

使用vsce工具创建安装包：

```bash
# 检查打包文件列表
npx vsce ls

# 生成vsix文件
npx vsce package
```

成功执行后，将生成`vscode-tree-sitter-query-0.0.6.vsix`文件。

## 安装方法

### 方法1: VSCode界面安装

1. 打开VSCode
2. 点击左侧活动栏的扩展图标(Ctrl+Shift+X)
3. 点击扩展视图右上角的"..."菜单
4. 选择"从VSIX安装"
5. 浏览并选择生成的`vscode-tree-sitter-query-0.0.6.vsix`文件
6. 点击"安装"按钮

### 方法2: 命令行安装

```bash
# 使用code命令安装
code --install-extension vscode-tree-sitter-query-0.0.6.vsix

# 验证安装
code --list-extensions | grep tree-sitter
```

### 方法3: 开发模式安装（无需打包）

适用于开发测试：

1. 在VSCode中打开项目文件夹
2. 按F5启动扩展开发主机
3. 在新的VSCode窗口中测试插件功能

## 插件功能验证

安装成功后，插件提供以下功能：

### 语言支持
- **Tree-Sitter Query语言** (.scm文件)
- **Tree-Sitter Notebook** (.tsqnb文件)

### 命令面板
- `Tree-Sitter Notebook`: 创建新的Tree-Sitter笔记本
- `Open Parse Tree View to Side`: 打开解析树视图

### 文件关联
- `.scm`文件自动使用Tree-Sitter Query语法高亮
- `.tsqnb`文件作为Notebook打开

### 验证步骤

1. **语法高亮测试**:
   ```scm
   ;; 创建test.scm文件
   (function_declaration
     name: (identifier) @function-name)
   ```

2. **Notebook测试**:
   - 创建新的.tsqnb文件
   - 验证Notebook界面是否正常加载

3. **命令测试**:
   - Ctrl+Shift+P打开命令面板
   - 输入"Tree-Sitter"查看可用命令

## 故障排除

### 常见构建错误

1. **Unix命令兼容性问题** (Windows系统):
   ```
   'cp' is not recognized as an internal or external command
   ```
   **解决**: 修改package.json中的build-wasm脚本，将`cp`改为`copy`，路径分隔符从`/`改为`\`

2. **依赖缺失错误**:
   ```
   Error: Cannot find module 'xxx'
   ```
   **解决**: 执行`npm install`安装所有依赖

3. **构建失败**:
   ```
   webpack compilation failed
   ```
   **解决**: 检查TypeScript代码语法，确保所有依赖正确安装

### 安装失败处理

1. **vsix安装失败**:
   - 检查VSCode版本是否满足要求(^1.84.0)
   - 确认vsix文件完整性
   - 查看VSCode开发者工具日志

2. **功能异常**:
   - 检查扩展是否启用
   - 查看扩展运行时日志
   - 重新加载VSCode窗口

## 构建脚本详解

### package.json脚本

```json
{
  "scripts": {
    "vscode:prepublish": "npm run package",
    "compile": "webpack",
    "watch": "webpack --watch", 
    "package": "npm run build-wasm && webpack --mode production --devtool hidden-source-map",
    "build-wasm": "ts-node src/buildWasm.ts && cp node_modules/web-tree-sitter/tree-sitter.wasm src/.wasm/",
    "lint": "eslint src --ext ts"
  }
}
```

### webpack配置

项目使用多目标构建：
- **Node.js扩展**: 目标为node环境
- **Web扩展**: 目标为webworker环境  
- **Notebook渲染器**: 独立的模块构建

## 构建成功验证

### 成功构建输出示例
```
=> Run vsce ls --tree to see all included files.

DONE  Packaged: D:\path\to\vscode-tree-sitter-query-0.0.6.vsix (45 files, 1.74 MB)
```

### 构建产物内容
- **主扩展文件**: `dist/extension.js` (Node.js环境)
- **Web扩展文件**: `dist/web/extension.js` (Web环境)
- **Notebook渲染器**: `dist/renderer.js`
- **WebAssembly文件**: 支持多种编程语言（C#, C++, Go, Java, JavaScript, Python, Ruby, Rust, TypeScript, TSX）
- **总大小**: 1.74MB（包含45个文件）

## 发布准备

如需发布到VSCode市场：

1. 确保版本号更新
2. 更新CHANGELOG.md
3. 运行完整测试
4. 使用`vsce publish`命令发布

## 相关资源

- [VSCode扩展API文档](https://aka.ms/vscode-extension-api)
- [VSCode扩展开发社区](https://aka.ms/vscode-discussions)
- [vsce工具文档](https://github.com/microsoft/vscode-vsce)