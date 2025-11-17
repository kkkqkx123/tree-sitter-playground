# TSQNB文件无法被Notebook解析的故障排查指南

## 问题分析

您创建的 `c-1.tsqnb` 文件格式是正确的，但VS Code无法识别为Notebook，这通常是由于以下原因：

### 1. 扩展未激活

**根本原因**：扩展的激活事件配置不当

**当前配置问题**：
```json
"activationEvents": [
    "onLanguage:typescript",
    "onLanguage:json"
]
```

**问题**：`.tsqnb` 文件不是TypeScript或JSON语言类型，扩展不会自动激活

### 2. 文件名模式配置错误

**症状**：保存文件时出现 "File name is not supported" 错误

**根本原因**：`filenamePattern` 配置为 `"tsqnb"` 而不是 `"*.tsqnb"`

**问题**：配置错误导致只匹配文件名为 "tsqnb" 的文件，而不是扩展名为 `.tsqnb` 的文件

### 2. 解决方案

#### 方案A：修改激活事件（已修复）

我已经更新了 `package.json`，添加了以下激活事件：

```json
"activationEvents": [
    "onLanguage:typescript",
    "onLanguage:json",
    "onNotebook:tree-sitter-query",  // 当打开tree-sitter-query类型的Notebook时激活
    "onLanguage:scm",                // 当打开SCM文件时激活
    "onLanguage:tsqnb",              // 当打开.tsqnb文件时激活
    "workspaceContains:**/*.tsqnb"   // 当工作区包含.tsqnb文件时激活
]
```

同时修复了 `filenamePattern` 配置：
- 从 `"tsqnb"` 改为 `"*.tsqnb"`

#### 方案B：手动激活扩展

1. **打开任意TypeScript文件**（`.ts`）
2. **打开任意JSON文件**（`.json`）
3. **使用命令面板**：`Ctrl+Shift+P` → 输入 "Tree-Sitter Notebook"

#### 方案C：重新编译扩展

```bash
# 清理并重新编译
npm run compile
```

### 3. 验证步骤

#### 步骤1：重新编译扩展

由于修改了 `package.json`，需要重新编译扩展：

```bash
npm run compile
```

#### 步骤2：检查扩展是否激活

1. 打开VS Code开发者工具：`Help` → `Toggle Developer Tools`
2. 查看控制台输出，寻找 "Tree-sitter Query extension is now active!"
3. 如果没有看到，扩展未激活

#### 步骤3：测试文件格式

确保您的文件内容格式正确：

```json
{
  "cells": [
    {
      "code": "const x = 1;\nconsole.log(x);",
      "language": "javascript",
      "kind": "code"
    },
    {
      "code": "(identifier) @identifier",
      "language": "scm",
      "kind": "code"
    }
  ]
}
```

**重要**：确保是有效的JSON格式，没有语法错误

#### 步骤3：文件扩展名验证

确保文件扩展名是 `.tsqnb`：
- ✅ `c-1.tsqnb`（正确）
- ❌ `c-1.tsqnb.json`（错误）
- ❌ `c-1`（错误）

#### 步骤4：测试打开方式

**方法1：双击打开**
1. 在VS Code文件资源管理器中找到文件
2. 双击 `c-1.tsqnb`

**方法2：命令面板**
1. `Ctrl+Shift+P`
2. 输入并选择 "Tree-Sitter Notebook"
3. 保存为 `.tsqnb` 文件

**方法3：右键菜单**
1. 右键点击文件
2. 选择 "Open With..."
3. 选择 "Tree-Sitter Query"

### 4. 常见问题排查

#### 问题A：扩展未安装/启用

1. 检查扩展是否已安装
2. 检查扩展是否被禁用
3. 重新加载VS Code窗口：`Ctrl+Shift+P` → "Reload Window"

#### 问题B：文件关联错误

检查文件图标：
- 如果显示为普通文本文件图标，说明关联失败
- 应该显示为Notebook图标

#### 问题C：JSON格式错误

使用VS Code验证JSON格式：
1. 打开文件
2. 查看是否有红色波浪线
3. 查看问题面板：`Ctrl+Shift+M`

### 5. 临时解决方案

如果扩展仍然无法激活，可以尝试：

#### 方法1：先激活扩展
1. 创建一个新的JavaScript文件（`test.js`）
2. 输入任意内容并保存
3. 现在扩展应该已激活
4. 再打开 `.tsqnb` 文件

#### 方法2：使用命令创建
1. `Ctrl+Shift+P`
2. "Tree-Sitter Notebook"
3. 这会创建一个新的Notebook文件
4. 保存为 `.tsqnb` 文件

### 6. 验证扩展功能

一旦文件被正确识别，您应该看到：

1. **Notebook界面**：显示为单元格格式，而不是纯文本
2. **执行按钮**：每个单元格左侧有播放按钮
3. **语言标识**：右下角显示 "JavaScript" 和 "scm"
4. **语法高亮**：代码有颜色高亮

### 7. 测试验证

我已经创建了一个测试文件 `test-notebook.tsqnb`，您可以：

1. 打开该文件验证扩展是否工作
2. 如果工作正常，说明扩展配置正确
3. 如果不工作，请按上述步骤排查

### 8. 重新编译扩展

如果修改了配置，需要重新编译：

```bash
npm install        # 安装依赖
npm run compile    # 编译扩展
```

然后重新加载VS Code窗口。

## 总结

您的问题很可能是由于扩展未激活导致的。通过添加适当的激活事件，扩展应该能够在打开 `.tsqnb` 文件时自动激活。如果问题仍然存在，请按照上述步骤逐一排查。