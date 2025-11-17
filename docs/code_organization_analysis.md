# 代码组织方式分析

## 整体架构设计

VS Code Tree-sitter Query 扩展采用了模块化的架构设计，将不同功能分离到独立的模块中，通过 VS Code 的 API 进行集成。整体遵循了 VS Code 扩展的标准结构。

## 文件组织结构

### 1. 核心入口模块

**`src/extension.ts`**
- 扩展的主入口点
- 负责初始化所有功能模块
- 注册命令、提供程序、序列化器等
- 管理扩展的生命周期（激活/停用）

### 2. Notebook 功能模块

**`src/controller.ts`**
- Notebook 执行控制器
- 处理代码和查询单元格的执行逻辑
- 管理 Tree-sitter 解析器的使用
- 处理执行结果的可视化输出

**`src/serializer.ts`**
- Notebook 数据的序列化和反序列化
- 定义 Notebook 的数据格式
- 处理单元格的语言类型和代码内容

**`src/renderer/tree-sitter-renderer.ts`**
- Notebook 输出的自定义渲染器
- 处理解析树的可视化显示
- 支持交互式操作（点击导航）

### 3. Tree-sitter 核心模块

**`src/treeSitter.ts`**
- Tree-sitter 语言加载和管理
- WASM 语言解析器的加载和缓存
- 语言枚举和映射定义

**`src/treeTraversal.ts`**
- 解析树的遍历工具函数
- 深度优先搜索实现
- 节点访问和处理的通用接口

### 4. 查询验证模块

**`src/queryDiagnosticsProvider.ts`**
- 查询语法验证和错误诊断
- TypeScript 文件中模板字符串的检测
- SCM 文件的独立验证
- 错误信息的提取和显示

### 5. 可视化模块

**`src/parseTreeEditor.ts`**
- 解析树编辑器的核心逻辑
- WebView 面板的创建和管理
- 文档变化监听和实时更新
- 交互式导航功能

**`src/parseTreePrinter.ts`**
- 解析树的格式化输出
- HTML 格式的生成
- 节点信息的组织和展示

### 6. 节点类型支持模块

**`src/nodeTypes.ts`**
- 节点类型的数据结构定义
- AST 节点的抽象表示

**`src/nodeTypesIndex.ts`**
- 节点类型的索引和搜索
- JSON 文件的解析和处理

**`src/nodeTypesDefinitionProvider.ts`**
- 节点类型定义的提供程序
- 跳转定义功能的实现

**`src/nodeTypesOutlineProvider.ts`**
- 节点类型的大纲视图提供程序
- 文档符号的层次化展示

### 7. 工具模块

**`src/utils.ts`**
- 通用的工具函数
- 延迟计算（Lazy）类的实现

**`src/util/`**
- 分类的工具函数库
- `common/`: 通用工具函数
- `vs/`: VS Code 相关的工具函数

### 8. 配置和构建模块

**`syntaxes/scm.tmLanguage.json`**
- Tree-sitter 查询语言的语法高亮配置
- TextMate 语法规则定义

**`language-configuration.json`**
- 语言配置文件
- 注释、括号、折叠等语言特性定义

**根目录配置文件**
- `package.json`: 扩展清单和依赖管理
- `tsconfig.json`: TypeScript 编译配置
- `webpack.config.js`: 打包配置
- `.eslintrc.json`: 代码质量检查

## 模块间依赖关系

```
extension.ts (入口)
├── controller.ts ←→ serializer.ts
├── treeSitter.ts (基础服务)
├── queryDiagnosticsProvider.ts
├── parseTreeEditor.ts → parseTreePrinter.ts
├── nodeTypes*.ts (模块群)
└── utils.ts (工具支持)
```

## 设计模式应用

### 1. 单例模式
`wasmLanguageLoader` 使用单例模式管理语言解析器的加载和缓存，避免重复加载 WASM 文件。

### 2. 观察者模式
大量使用 VS Code 的事件监听机制：
- 文档变化事件
- 选择变化事件
- Notebook 执行事件

### 3. 策略模式
`getWasmLanguage` 函数根据语言 ID 返回对应的 WASM 语言类型，实现语言选择的策略模式。

### 4. 工厂模式
`createNotebookController` 函数创建 Notebook 控制器实例，封装复杂的初始化逻辑。

### 5. 提供程序模式
大量实现 VS Code 的提供程序接口：
- `DefinitionProvider`: 定义跳转
- `DocumentSymbolProvider`: 文档符号
- `DiagnosticProvider`: 错误诊断

## 数据流设计

### 1. Notebook 执行流程
```
用户输入 → controller.ts → treeSitter.ts → WASM 解析器 → 执行结果 → 渲染器 → 用户界面
```

### 2. 查询验证流程
```
文档变化 → queryDiagnosticsProvider.ts → treeSitter.ts → 语法验证 → 错误信息 → VS Code 诊断系统
```

### 3. 解析树可视化流程
```
文档打开 → parseTreeEditor.ts → treeSitter.ts → 解析树生成 → parseTreePrinter.ts → WebView 显示
```

## 扩展性设计

### 1. 语言支持扩展
通过修改 `WASMLanguage` 枚举和 `getWasmLanguage` 函数，可以轻松添加新的编程语言支持。

### 2. 功能模块扩展
遵循 VS Code 扩展的标准接口，可以方便地添加新的提供程序和功能模块。

### 3. 输出格式扩展
Notebook 的渲染器设计支持添加新的输出格式和可视化方式。

## 错误处理设计

### 1. 分层错误处理
- 底层：Tree-sitter 解析错误
- 中层：模块内部错误处理
- 上层：用户友好的错误提示

### 2. 资源管理
- WASM 解析器的生命周期管理
- 解析树的创建和销毁
- 事件监听器的注册和注销

### 3. 异步操作管理
- Promise 的错误处理
- async/await 的异常捕获
- 资源清理的 finally 块

这种模块化的代码组织方式使得扩展具有良好的可维护性、可测试性和可扩展性，每个模块都有明确的职责和接口，便于独立开发和调试。