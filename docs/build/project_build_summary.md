# 项目构建总结

## VSCode Tree-Sitter Query 插件构建分析

### 项目概况
- **项目名称**: vscode-tree-sitter-query
- **类型**: VSCode扩展插件
- **主要功能**: 提供Tree-Sitter查询语言和Notebook支持
- **构建工具**: webpack + vsce
- **支持环境**: Node.js + Web

### 构建流程总结

#### 1. 依赖安装
```bash
npm install
```

#### 2. 版本兼容性修复
- 问题: `build-wasm`脚本使用了Unix的`cp`命令，在Windows上不可用
- 解决: 修改package.json，将`cp`改为Windows的`copy`命令

#### 3. 完整构建
```bash
npm run package
```

构建过程包含：
- **WebAssembly构建**: `npm run build-wasm`（构建多种语言的wasm文件）
- **生产打包**: `webpack --mode production`（生成三个环境的构建产物）
- **输出文件**: 
  - `dist/extension.js` (Node.js环境)
  - `dist/web/extension.js` (Web环境)
  - `dist/renderer.js` (Notebook渲染器)

#### 4. vsix包生成
```bash
npx vsce package
```

✅ **构建成功**: 生成`vscode-tree-sitter-query-0.0.6.vsix`（1.74MB，45个文件）

### 安装方法

#### 界面安装
1. VSCode → 扩展 → "..." → "从VSIX安装"
2. 选择生成的vsix文件

#### 命令行安装
```bash
code --install-extension vscode-tree-sitter-query-0.0.6.vsix
```

#### 开发模式
- F5启动扩展开发主机
- 无需打包vsix文件

### 插件功能
- **语言支持**: .scm (Tree-Sitter Query), .tsqnb (Notebook)
- **命令**: 创建Notebook、打开解析树视图
- **语法高亮**: Tree-Sitter查询语法
- **Notebook界面**: 支持.tsqnb文件格式

### 关键配置
- **package.json**: 插件清单和依赖
- **webpack.config.js**: 多目标构建配置
- **.vscodeignore**: 打包忽略规则

### 故障排除要点
- 版本兼容性检查
- 依赖完整性验证
- 构建日志分析
- VSCode版本要求确认

文档位置: `docs/vsix_build_installation_guide.md`