# VS Code Notebook 配置指南

## 当前配置分析

### 当前 package.json 中的 notebook 配置

```json
"contributes": {
    "notebooks": [
        {
            "type": "tree-sitter-query",
            "displayName": "Tree-sitter Query Notebook",
            "selector": [
                {
                    "filenamePattern": "*.tsqnb"
                }
            ]
        }
    ],
    "notebookEditor": {
        "viewType": "tree-sitter-query",
        "displayName": "Tree-sitter Query Notebook",
        "selector": [
            {
                "filenamePattern": "*.tsqnb"
            }
        ]
    }
}
```

## Notebook 配置核心组件

### 1. Notebooks 贡献点 (notebooks)

**作用**: 定义笔记本类型和文件关联规则

**配置参数**:
- `type`: 笔记本的唯一标识符（必须与 notebookEditor 的 viewType 一致）
- `displayName`: 在 UI 中显示的笔记本名称
- `selector`: 文件选择器配置

### 2. NotebookEditor 贡献点 (notebookEditor)

**作用**: 定义笔记本编辑器的具体行为

**配置参数**:
- `viewType`: 视图类型（必须与 notebooks 的 type 一致）
- `displayName`: 编辑器显示名称
- `selector`: 文件选择器配置

## 文件关联配置详解

### filenamePattern 语法

`filenamePattern` 支持 glob 模式匹配：

```json
"selector": [
    {
        "filenamePattern": "*.tsqnb"  // 匹配所有 .tsqnb 文件
    },
    {
        "filenamePattern": "test-*.tsqnb"  // 匹配以 test- 开头的 .tsqnb 文件
    },
    {
        "filenamePattern": "**/*.tsqnb"  // 递归匹配所有子目录中的 .tsqnb 文件
    }
]
```

### 多模式匹配

可以配置多个模式来匹配不同类型的文件：

```json
"selector": [
    {
        "filenamePattern": "*.tsqnb"
    },
    {
        "filenamePattern": "*.tree-sitter"
    },
    {
        "filenamePattern": "query-*.json"
    }
]
```

## 激活事件配置

### 必要的激活事件

```json
"activationEvents": [
    "onNotebook:tree-sitter-query",  // 笔记本类型激活
    "workspaceContains:**/*.tsqnb"   // 工作区包含特定文件时激活
]
```

### 推荐的激活事件组合

```json
"activationEvents": [
    "onLanguage:typescript",
    "onLanguage:json", 
    "onNotebook:tree-sitter-query",
    "workspaceContains:**/*.tsqnb",
    "onCommand:vscode-treesitter-notebook.new"
]
```

## 完整的 Notebook 配置示例

### 基础配置

```json
{
    "activationEvents": [
        "onNotebook:tree-sitter-query",
        "workspaceContains:**/*.tsqnb"
    ],
    "contributes": {
        "notebooks": [
            {
                "type": "tree-sitter-query",
                "displayName": "Tree-sitter Query Notebook",
                "selector": [
                    {
                        "filenamePattern": "*.tsqnb"
                    }
                ]
            }
        ],
        "notebookEditor": {
            "viewType": "tree-sitter-query", 
            "displayName": "Tree-sitter Query Notebook",
            "selector": [
                {
                    "filenamePattern": "*.tsqnb"
                }
            ]
        },
        "notebookRenderer": [
            {
                "id": "tree-sitter-notebook",
                "displayName": "Tree-Sitter Output Renderer",
                "mimeTypes": [
                    "x-application/tree-sitter"
                ],
                "requiresMessaging": "always",
                "entrypoint": "./dist/renderer.js"
            }
        ]
    }
}
```

### 高级配置（支持多种文件类型）

```json
{
    "contributes": {
        "notebooks": [
            {
                "type": "tree-sitter-query",
                "displayName": "Tree-sitter Query Notebook",
                "selector": [
                    {
                        "filenamePattern": "*.tsqnb"
                    },
                    {
                        "filenamePattern": "*.tree-sitter"
                    },
                    {
                        "filenamePattern": "query-*.json"
                    }
                ]
            }
        ],
        "notebookEditor": {
            "viewType": "tree-sitter-query",
            "displayName": "Tree-sitter Query Notebook",
            "selector": [
                {
                    "filenamePattern": "*.tsqnb"
                },
                {
                    "filenamePattern": "*.tree-sitter"
                }
            ]
        }
    }
}
```

## 配置验证和调试

### 1. 配置验证脚本

```javascript
// diagnose-notebook.js
const fs = require('fs');
const path = require('path');

// 检查 package.json 配置
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// 验证 notebooks 配置
if (packageJson.contributes.notebooks) {
    console.log('✅ Notebooks 配置存在');
    packageJson.contributes.notebooks.forEach((notebook, index) => {
        console.log(`  Notebook ${index + 1}: ${notebook.type}`);
        if (notebook.selector) {
            notebook.selector.forEach(selector => {
                console.log(`    Pattern: ${selector.filenamePattern}`);
            });
        }
    });
}

// 验证 notebookEditor 配置
if (packageJson.contributes.notebookEditor) {
    console.log('✅ NotebookEditor 配置存在');
    console.log(`  ViewType: ${packageJson.contributes.notebookEditor.viewType}`);
}

// 验证激活事件
if (packageJson.activationEvents) {
    const notebookEvents = packageJson.activationEvents.filter(event => 
        event.includes('onNotebook') || event.includes('workspaceContains')
    );
    console.log('✅ Notebook 相关激活事件:', notebookEvents);
}
```

### 2. 常见配置问题排查

#### 问题1: 笔记本类型不匹配
```json
// 错误配置
"notebooks": [{"type": "tree-sitter-query"}],
"notebookEditor": {"viewType": "tree-sitter"}  // 类型不匹配！

// 正确配置
"notebooks": [{"type": "tree-sitter-query"}],
"notebookEditor": {"viewType": "tree-sitter-query"}  // 类型一致
```

#### 问题2: 文件模式语法错误
```json
// 错误配置
"filenamePattern": "*.tsqnb"  // 缺少引号或格式错误

// 正确配置  
"filenamePattern": "*.tsqnb"
```

#### 问题3: 激活事件缺失
```json
// 错误配置 - 缺少必要的激活事件
"activationEvents": ["onLanguage:typescript"]

// 正确配置
"activationEvents": [
    "onNotebook:tree-sitter-query",
    "workspaceContains:**/*.tsqnb"
]
```

## 最佳实践

### 1. 配置一致性
- 确保 `notebooks.type` 和 `notebookEditor.viewType` 完全一致
- 文件选择器模式在 notebooks 和 notebookEditor 中保持一致

### 2. 文件模式设计
- 使用明确的文件扩展名（如 `.tsqnb`）
- 避免过于宽泛的模式匹配
- 考虑支持多种相关文件类型

### 3. 激活策略
- 使用 `onNotebook` 事件确保笔记本打开时激活
- 使用 `workspaceContains` 提前激活扩展
- 避免不必要的激活事件以减少性能影响

### 4. 错误处理
- 在序列化器中实现完善的错误处理
- 提供有意义的错误消息
- 支持文件格式的向后兼容

## 当前项目配置评估

### 优势
1. ✅ 笔记本类型和编辑器配置一致
2. ✅ 文件选择器模式正确
3. ✅ 激活事件配置完整
4. ✅ 序列化器实现完善

### 改进建议
1. 🔧 考虑支持更多相关文件类型
2. 🔧 添加更详细的错误日志
3. 🔧 实现配置验证工具

通过遵循这些配置指南，可以确保笔记本扩展能够正确识别和处理目标文件类型。