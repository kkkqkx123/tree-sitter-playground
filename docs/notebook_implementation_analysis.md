# VS Code Tree-sitter Query Notebook 功能实现分析

## 当前Notebook实现概述

### 1. Notebook类型定义
扩展定义了一个自定义的Notebook类型 `tree-sitter-query`，具有以下特征：

**文件扩展名**: `.tsqnb` (Tree-sitter Query Notebook)
**显示名称**: "Tree-Sitter Query"
**MIME类型**: `x-application/tree-sitter` (自定义输出格式)

### 2. Notebook数据结构

#### 单元格类型
- **代码单元格**: 支持多种编程语言（Python, JavaScript, TypeScript等）
- **查询单元格**: 使用Tree-sitter查询语言（`.scm`语法）

#### 数据格式
```typescript
interface NotebookCell {
    code: string;        // 单元格内容
    language: string;    // 编程语言
    kind: 'code' | 'markdown';  // 单元格类型
}

interface NotebookData {
    cells: NotebookCell[];
}
```

### 3. 执行流程

#### 执行控制器 (`controller.ts`)
1. **单元格识别**: 区分代码单元格和查询单元格
2. **语言加载**: 根据代码语言加载对应的WASM解析器
3. **语法分析**: 解析代码生成语法树
4. **查询执行**: 如果是查询单元格，对语法树执行查询
5. **结果输出**: 格式化结果并显示

#### 执行逻辑
```typescript
// 代码单元格执行结果
{
    nodes: [{
        depth: number;
        uri: string;
        node: {
            fieldName: string;
            type: string;
            startPosition: Parser.Point;
            endPosition: Parser.Point;
        }
    }]
}

// 查询单元格执行结果
[{
    captureName: string;
    type: string;
    text: string;
    startPosition: Parser.Point;
    endPosition: Parser.Point;
}]
```

### 4. 序列化机制 (`serializer.ts`)

#### 序列化
将Notebook数据转换为JSON格式的Uint8Array：
```typescript
serializeNotebook(data: vscode.NotebookData): Uint8Array {
    const cells = data.cells.map((cell) => {
        return { 
            code: cell.value, 
            language: cell.languageId, 
            kind: cell.kind === vscode.NotebookCellKind.Markup ? 'markdown' : 'code' 
        };
    });
    return new TextEncoder().encode(JSON.stringify({ cells }));
}
```

#### 反序列化
从Uint8Array解析JSON数据并重建Notebook：
```typescript
deserializeNotebook(content: Uint8Array): vscode.NotebookData {
    const stringified = new TextDecoder().decode(content);
    const data = JSON.parse(stringified);
    // 验证和重建单元格数据
}
```

### 5. 渲染器实现 (`renderer/tree-sitter-renderer.ts`)

#### 渲染逻辑
1. **清空容器**: 移除之前的渲染内容
2. **解析数据**: 从输出项中提取节点数据
3. **创建DOM**: 为每个节点创建可点击的链接元素
4. **事件绑定**: 添加鼠标悬停和点击事件

#### 交互功能
- **点击导航**: 点击节点可以定位到源代码中的对应位置
- **视觉反馈**: 鼠标悬停时显示下划线
- **层级缩进**: 根据节点深度进行缩进显示

## 与Jupyter Notebook的对比

### 相似点
1. **单元格结构**: 都支持代码和文本单元格
2. **执行模型**: 支持逐个单元格执行
3. **输出显示**: 支持富文本和结构化输出
4. **序列化**: 都使用JSON格式保存Notebook数据

### 不同点

| 特性 | Tree-sitter Notebook | Jupyter Notebook |
|------|---------------------|-------------------|
| **文件扩展名** | `.tsqnb` | `.ipynb` |
| **执行环境** | WebAssembly (本地) | Python Kernel (远程/本地) |
| **输出格式** | 自定义JSON格式 | Jupyter标准格式 |
| **语言支持** | 9种编程语言 + Tree-sitter查询 | 多种编程语言 |
| **交互性** | 点击节点导航到代码 | 富交互式输出 |
| **渲染器** | 自定义DOM渲染 | HTML/Markdown渲染 |

## 实现XML文件加载为Notebook界面的方案

### 方案一：扩展现有序列化器

#### 1. 修改序列化器支持XML格式
```typescript
// 在 serializer.ts 中添加XML支持
import { parseString } from 'xml2js';

export class NotebookSerializer implements vscode.NotebookSerializer {
    // ... 现有代码 ...
    
    async deserializeNotebook(content: Uint8Array): vscode.NotebookData {
        const contentStr = new TextDecoder().decode(content);
        
        // 检测是否为XML格式
        if (contentStr.trim().startsWith('<?xml') || contentStr.trim().startsWith('<notebook>')) {
            return this.deserializeXML(contentStr);
        }
        
        // 原有的JSON反序列化逻辑
        return this.deserializeJSON(contentStr);
    }
    
    private async deserializeXML(xmlContent: string): vscode.NotebookData {
        const result = await parseString(xmlContent);
        const xmlNotebook = result.notebook;
        
        const cells: vscode.NotebookCellData[] = [];
        
        // 转换XML单元格为VS Code单元格格式
        if (xmlNotebook.cell) {
            for (const xmlCell of xmlNotebook.cell) {
                const cellData = new vscode.NotebookCellData(
                    xmlCell.$.type === 'code' ? vscode.NotebookCellKind.Code : vscode.NotebookCellKind.Markup,
                    xmlCell._ || xmlCell.text?.[0] || '',
                    xmlCell.$.language || 'javascript'
                );
                cells.push(cellData);
            }
        }
        
        return new vscode.NotebookData(cells);
    }
    
    serializeNotebook(data: vscode.NotebookData): Uint8Array {
        // 可以添加选项支持XML序列化
        const useXML = vscode.workspace.getConfiguration('treeSitterNotebook').get('serializeAsXML', false);
        
        if (useXML) {
            return this.serializeXML(data);
        }
        
        return this.serializeJSON(data);
    }
    
    private serializeXML(data: vscode.NotebookData): Uint8Array {
        const xmlCells = data.cells.map(cell => ({
            $: {
                type: cell.kind === vscode.NotebookCellKind.Code ? 'code' : 'markdown',
                language: cell.languageId
            },
            _: cell.value
        }));
        
        const xmlNotebook = {
            notebook: {
                cell: xmlCells
            }
        };
        
        const xmlStr = new xml2js.Builder().buildObject(xmlNotebook);
        return new TextEncoder().encode(xmlStr);
    }
}
```

#### 2. 添加XML文件关联
在 `package.json` 中添加XML文件支持：
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
                    "filenamePattern": "*.xml"
                }
            ]
        }
    ]
}
```

### 方案二：创建专用的XML Notebook提供程序

#### 1. 创建XML Notebook提供程序
```typescript
// src/xmlNotebookProvider.ts
import * as vscode from 'vscode';
import { parseString, Builder } from 'xml2js';

export class XMLNotebookProvider implements vscode.NotebookSerializer {
    static readonly notebookType = 'xml-notebook';
    
    async deserializeNotebook(content: Uint8Array): Promise<vscode.NotebookData> {
        const xmlContent = new TextDecoder().decode(content);
        const result = await parseString(xmlContent);
        
        const cells: vscode.NotebookCellData[] = [];
        const xmlCells = result.notebook?.cell || [];
        
        for (const xmlCell of xmlCells) {
            const cellType = xmlCell.$?.type || 'code';
            const language = xmlCell.$?.language || 'javascript';
            const content = xmlCell._ || xmlCell.text?.[0] || '';
            
            cells.push(new vscode.NotebookCellData(
                cellType === 'code' ? vscode.NotebookCellKind.Code : vscode.NotebookCellKind.Markup,
                content,
                language
            ));
        }
        
        return new vscode.NotebookData(cells);
    }
    
    serializeNotebook(data: vscode.NotebookData): Uint8Array {
        const xmlCells = data.cells.map(cell => ({
            $: {
                type: cell.kind === vscode.NotebookCellKind.Code ? 'code' : 'markdown',
                language: cell.languageId
            },
            _: cell.value
        }));
        
        const xmlNotebook = {
            notebook: {
                $: { version: '1.0' },
                cell: xmlCells
            }
        };
        
        const builder = new Builder();
        const xmlStr = builder.buildObject(xmlNotebook);
        return new TextEncoder().encode(xmlStr);
    }
}
```

#### 2. 注册XML Notebook类型
在 `extension.ts` 中注册：
```typescript
export async function activate(context: vscode.ExtensionContext) {
    // ... 现有代码 ...
    
    const xmlSerializer = new XMLNotebookProvider();
    const xmlController = vscode.notebooks.createNotebookController(
        'xml-notebook',
        'xml-notebook', 
        'XML Notebook',
        async (cells, notebook, controller) => {
            // 重用现有的执行逻辑
            // 可以适配为处理XML格式的Notebook
        }
    );
    
    context.subscriptions.push(
        vscode.workspace.registerNotebookSerializer('xml-notebook', xmlSerializer),
        vscode.commands.registerCommand('xmlNotebook.new', async () => {
            const data = xmlSerializer.createNew();
            const notebookDocument = await vscode.workspace.openNotebookDocument("xml-notebook", data);
            await vscode.commands.executeCommand("vscode.openWith", notebookDocument.uri, "xml-notebook");
        })
    );
}
```

### 方案三：Jupyter兼容格式支持

#### 1. 支持Jupyter Notebook格式
```typescript
// 在序列化器中添加Jupyter格式支持
interface JupyterNotebook {
    cells: JupyterCell[];
    metadata: any;
    nbformat: number;
    nbformat_minor: number;
}

interface JupyterCell {
    cell_type: 'code' | 'markdown';
    source: string | string[];
    metadata?: any;
    outputs?: any[];
    execution_count?: number | null;
}

export class JupyterCompatibleSerializer implements vscode.NotebookSerializer {
    async deserializeNotebook(content: Uint8Array): vscode.NotebookData {
        const contentStr = new TextDecoder().decode(content);
        const jupyterData = JSON.parse(contentStr) as JupyterNotebook;
        
        const cells: vscode.NotebookCellData[] = [];
        
        for (const jupyterCell of jupyterData.cells) {
            const source = Array.isArray(jupyterCell.source) 
                ? jupyterCell.source.join('')
                : jupyterCell.source;
            
            cells.push(new vscode.NotebookCellData(
                jupyterCell.cell_type === 'code' ? vscode.NotebookCellKind.Code : vscode.NotebookCellKind.Markup,
                source,
                'python' // 可以根据需要检测语言
            ));
        }
        
        return new vscode.NotebookData(cells);
    }
    
    serializeNotebook(data: vscode.NotebookData): Uint8Array {
        const jupyterCells: JupyterCell[] = data.cells.map(cell => ({
            cell_type: cell.kind === vscode.NotebookCellKind.Code ? 'code' : 'markdown',
            source: cell.value,
            metadata: {},
            outputs: [],
            execution_count: null
        }));
        
        const jupyterNotebook: JupyterNotebook = {
            cells: jupyterCells,
            metadata: {
                kernelspec: {
                    display_name: "Tree-sitter",
                    language: "query",
                    name: "tree-sitter"
                },
                language_info: {
                    name: "tree-sitter-query",
                    version: ""
                }
            },
            nbformat: 4,
            nbformat_minor: 4
        };
        
        return new TextEncoder().encode(JSON.stringify(jupyterNotebook, null, 2));
    }
}
```

## 推荐的实现方案

### 最佳实践：方案一（扩展现有序列化器）

**优势**:
1. **向后兼容**: 保持现有的Notebook类型和文件扩展名
2. **用户友好**: 用户无需学习新的Notebook类型
3. **维护简单**: 最小化代码变更
4. **自动检测**: 根据文件内容自动选择解析方式

**实现步骤**:
1. 添加XML解析依赖（如 `xml2js`）
2. 修改序列化器支持XML格式
3. 添加XML文件关联配置
4. 测试XML文件的读写功能

**XML格式建议**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<notebook version="1.0">
    <cell type="code" language="javascript">
        const x = 1;
        console.log(x);
    </cell>
    <cell type="code" language="scm">
        (identifier) @variable
    </cell>
    <cell type="markdown">
        # Tree-sitter Query Example
        This notebook demonstrates tree-sitter query functionality.
    </cell>
</notebook>
```

这种实现方式可以让用户像使用Jupyter Notebook一样，通过简单的XML文件来创建和编辑Tree-sitter查询Notebook，同时保持所有现有的功能特性。