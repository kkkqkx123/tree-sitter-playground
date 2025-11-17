# TSQNB文件解析配置说明

## 当前TSQNB文件解析机制

### 1. 文件关联配置

在 `package.json` 中定义了Notebook类型与文件扩展名的关联：

```json
{
  "notebooks": [
    {
      "type": "tree-sitter-query",
      "displayName": "Tree-Sitter Query",
      "selector": [
        {
          "filenamePattern": "tsqnb"
        }
      ]
    }
  ]
}
```

**关键配置说明**：
- `type`: `"tree-sitter-query"` - Notebook类型标识符
- `displayName`: `"Tree-Sitter Query"` - 在VS Code中显示的名称
- `selector.filenamePattern`: `"tsqnb"` - 文件匹配模式

### 2. 序列化器注册

在 `extension.ts` 中注册序列化器：

```typescript
context.subscriptions.push(
    vscode.workspace.registerNotebookSerializer('tree-sitter-query', serializer)
);
```

**注册逻辑**：
- 使用相同的 `type` 标识符 `"tree-sitter-query"`
- 传入 `NotebookSerializer` 实例作为序列化器

### 3. 默认初始结构

`NotebookSerializer.createNew()` 方法定义了新建Notebook的初始结构：

```typescript
createNew(): vscode.NotebookData {
    const queryCell = new vscode.NotebookCellData(vscode.NotebookCellKind.Code, '(identifier) @identifier', 'scm');
    const sourceCodeCell = new vscode.NotebookCellData(vscode.NotebookCellKind.Code, 'const x = 1;', 'javascript');
    return new vscode.NotebookData([sourceCodeCell, queryCell]);
}
```

**默认结构包含**：
1. **JavaScript代码单元格**：`const x = 1;`
2. **Tree-sitter查询单元格**：`(identifier) @identifier`

### 4. 文件格式要求

#### JSON格式结构
```json
{
  "cells": [
    {
      "code": "单元格内容",
      "language": "编程语言",
      "kind": "code" | "markdown"
    }
  ]
}
```

#### 必需的属性
- `cells`: 单元格数组（必需）
- `code`: 单元格内容（必需）
- `kind`: 单元格类型（必需，值为 `"code"` 或 `"markdown"`）
- `language`: 编程语言（可选，默认为 `"scm"`）

### 5. 支持的文件扩展名

当前配置只支持 `.tsqnb` 扩展名，但可以通过以下方式扩展：

#### 添加更多扩展名
```json
{
  "notebooks": [
    {
      "type": "tree-sitter-query",
      "displayName": "Tree-Sitter Query",
      "selector": [
        {
          "filenamePattern": "tsqnb"
        },
        {
          "filenamePattern": "*.tsqnb"
        },
        {
          "filenamePattern": "tree-sitter-notebook"
        }
      ]
    }
  ]
}
```

#### 支持无扩展名文件
```json
{
  "selector": [
    {
      "filenamePattern": "tsqnb"
    },
    {
      "filenamePattern": "*tree-sitter*"
    }
  ]
}
```

## 让TSQNB文件被Notebook解析的步骤

### 步骤1：确保文件扩展名正确
文件必须以 `.tsqnb` 结尾，例如：
- `example.tsqnb`
- `my-notebook.tsqnb`
- `test.tsqnb`

### 步骤2：创建有效的JSON内容
文件内容必须符合序列化器要求的JSON格式：

```json
{
  "cells": [
    {
      "code": "const message = 'Hello World';",
      "language": "javascript",
      "kind": "code"
    },
    {
      "code": "(string) @string",
      "language": "scm",
      "kind": "code"
    }
  ]
}
```

### 步骤3：通过VS Code打开
1. **文件资源管理器**：双击 `.tsqnb` 文件
2. **命令面板**：使用 "Tree-Sitter Notebook" 命令创建新文件
3. **文件菜单**：File → New File → Tree-Sitter Notebook

### 步骤4：验证解析
如果文件格式正确，VS Code会自动：
1. 识别为Notebook类型
2. 使用Tree-sitter查询编辑器打开
3. 显示单元格界面
4. 启用执行功能

## 常见问题排查

### 文件无法识别为Notebook
**可能原因**：
1. 文件扩展名不是 `.tsqnb`
2. 扩展未激活（需要打开TypeScript或JSON文件激活）

**解决方案**：
1. 重命名为 `.tsqnb` 扩展名
2. 先打开任意 `.ts` 或 `.json` 文件激活扩展

### JSON格式错误
**常见错误**：
- 缺少 `cells` 属性
- `cells` 不是数组
- 单元格缺少必需属性

**验证方法**：
使用VS Code的JSON验证功能，确保格式正确。

### 扩展未加载
**检查方法**：
1. 查看扩展是否已安装
2. 检查开发者工具中的错误日志
3. 确认激活事件已触发

## 扩展示例

### 最小有效TSQNB文件
```json
{
  "cells": [
    {
      "code": "console.log('Hello');",
      "language": "javascript",
      "kind": "code"
    }
  ]
}
```

### 完整功能示例
```json
{
  "cells": [
    {
      "code": "function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }",
      "language": "javascript",
      "kind": "code"
    },
    {
      "code": "(function_declaration) @function",
      "language": "scm",
      "kind": "code"
    },
    {
      "code": "# Analysis Results\nThis query finds all function declarations.",
      "language": "markdown",
      "kind": "markdown"
    }
  ]
}
```

通过正确配置和格式，任何 `.tsqnb` 文件都能被VS Code识别并用Tree-sitter Notebook编辑器打开。