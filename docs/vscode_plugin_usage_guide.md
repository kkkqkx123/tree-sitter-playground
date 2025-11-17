# VS Code Tree-sitter Query 插件使用指南

## 概述

VS Code Tree-sitter Query 扩展是一个功能强大的语法分析和查询工具，为开发者提供了交互式的 Tree-sitter 查询环境。它支持多种编程语言的语法分析和模式匹配。

## 安装和激活

### 安装方式
1. **从VS Code市场安装**：搜索 "Tree-sitter Query" 并安装
2. **从VSIX文件安装**：下载 `.vsix` 文件后使用 "Extensions: Install from VSIX" 命令
3. **从源码安装**：克隆仓库后运行 `npm install && npm run package` 生成VSIX文件

### 激活条件
扩展在以下情况下自动激活：
- 打开 TypeScript (`.ts`, `.tsx`) 文件
- 打开 JSON (`.json`) 文件  
- 打开 Tree-sitter Notebook (`.tsqnb`) 文件
- 工作区包含 `.tsqnb` 文件

## 主要功能使用

### 1. Tree-sitter Notebook

#### 创建新Notebook
1. **通过命令面板**：按 `Ctrl+Shift+P`，输入 "Tree-Sitter Notebook"
2. **通过文件菜单**：File → New File → Tree-Sitter Notebook
3. **通过命令**：`vscode-treesitter-notebook.new`

#### Notebook结构
每个Notebook包含两种类型的单元格：

**代码单元格**：
- 支持9种编程语言：JavaScript, TypeScript, Python, Go, Ruby, C#, C++, Java, Rust
- 用于输入源代码进行分析

**查询单元格**：
- 使用Tree-sitter查询语言（`.scm`语法）
- 用于编写模式匹配查询

#### 执行流程
1. 添加至少一个代码单元格
2. 添加查询单元格（可选）
3. 点击运行按钮或使用 `Ctrl+Enter`
4. 查看解析树和查询结果

### 2. 语法高亮支持

#### 支持的文件类型
- **`.scm` 文件**：Tree-sitter查询语言文件
- **`.tsqnb` 文件**：Tree-sitter Notebook文件

#### 语法元素
- 节点类型：`(identifier)`
- 字段名：`field: (expression)`
- 捕获变量：`@variable`
- 注释：`; 这是注释`

### 3. 查询验证功能

#### 实时验证
- TypeScript文件中的 `treeSitterQuery` 模板字符串
- 独立的 `.scm` 查询文件
- 提供详细的错误信息和位置标记

#### 目标语言指定
在查询文件中使用注释指定目标语言：
```scm
;; language: javascript
(identifier) @id
```

### 4. 解析树可视化

#### 打开解析树视图
1. **通过命令**：`vscode-treesitter-parse-tree-editor.createToSide`
2. **右键菜单**：在编辑器中右键选择 "Open Parse Tree View to Side"

#### 功能特性
- 实时更新：代码修改时自动刷新
- 交互式导航：点击树节点定位到源代码
- 语法高亮：同步显示选中代码区域

## 使用示例

### 示例1：JavaScript代码分析
1. 创建新Notebook
2. 在第一个单元格输入：
```javascript
function greet(name) {
    return `Hello, ${name}!`;
}
```
3. 在第二个单元格输入：
```scm
(function_declaration
  name: (identifier) @function-name
  parameters: (formal_parameters) @params)
```
4. 运行所有单元格查看函数声明结构

### 示例2：多语言支持
支持在不同语言的代码单元格中切换：
```python
# Python代码
def calculate_sum(a, b):
    return a + b
```

```scm
; Python查询
(function_definition
  name: (identifier) @function-name)
```

### 示例3：复杂查询模式
```scm
; 查找所有函数调用
(call_expression
  function: (identifier) @function-call
  arguments: (arguments) @args)

; 查找变量声明
(variable_declarator
  name: (identifier) @var-name
  value: (expression) @var-value)
```

## 高级功能

### 1. 自定义节点类型

#### node-types.json 支持
扩展为 `node-types.json` 文件提供增强支持：
- 符号大纲视图
- 定义跳转功能
- 节点类型导航

### 2. Web支持

扩展在VS Code Web版本中也可使用：
- 自动处理WASM文件路径
- 支持在线环境中的语法分析
- 完整的Notebook功能

### 3. 调试和诊断

#### 错误处理
- 详细的语法错误信息
- 位置精确的错误标记
- 建议性的修复提示

#### 性能优化
- WASM解析器缓存
- 异步加载避免阻塞
- 增量解析支持

## 配置选项

### 扩展设置
在VS Code设置中搜索 "tree-sitter" 找到相关配置：

- `treeSitterNotebook.serializeAsXML`: 是否使用XML格式序列化
- `treeSitterQuery.validation.enabled`: 启用/禁用查询验证
- `treeSitter.parseTree.autoRefresh`: 自动刷新解析树

## 故障排除

### 常见问题

1. **扩展未激活**
   - 检查是否打开了支持的文件类型
   - 查看扩展是否已正确安装

2. **WASM加载失败**
   - 确保网络连接正常（在线版本）
   - 检查扩展文件完整性

3. **查询语法错误**
   - 查看错误提示信息
   - 参考Tree-sitter查询文档

4. **语言不支持**
   - 确认使用的语言在支持列表中
   - 检查语言标识符是否正确

### 日志和调试

启用扩展日志输出：
```json
{
  "treeSitterQuery.logLevel": "debug"
}
```

查看输出面板中的 "Tree-sitter Query" 频道获取详细日志。

## 最佳实践

### 1. Notebook组织
- 将相关代码和查询放在相邻单元格
- 使用Markdown单元格添加说明文档
- 分组相关的查询模式

### 2. 查询编写
- 从简单查询开始，逐步复杂化
- 使用注释说明查询意图
- 测试查询在不同代码样例上的效果

### 3. 性能考虑
- 避免过于复杂的嵌套查询
- 在大型代码文件上谨慎使用实时解析
- 利用缓存机制提高性能

## 资源链接

- [Tree-sitter官方文档](https://tree-sitter.github.io/tree-sitter/)
- [查询语言语法参考](https://tree-sitter.github.io/tree-sitter/using-parsers#pattern-matching-with-queries)
- [GitHub仓库](https://github.com/jrieken/vscode-tree-sitter-query)
- [问题反馈](https://github.com/jrieken/vscode-tree-sitter-query/issues)

## 版本兼容性

- **VS Code版本**: ^1.84.0
- **Node.js版本**: 推荐16.x或更高
- **浏览器支持**: Chrome, Edge, Firefox, Safari (Web版本)

通过本指南，您可以充分利用VS Code Tree-sitter Query扩展的所有功能，提升语法分析和代码查询的开发体验。