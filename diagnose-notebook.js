const fs = require('fs');
const path = require('path');

console.log('=== Tree-sitter Notebook 诊断工具 ===\n');

// 1. 检查test.tsqnb文件
console.log('1. 检查test.tsqnb文件:');
const testFile = path.join(__dirname, 'test.tsqnb');
if (fs.existsSync(testFile)) {
    console.log('   ✅ 文件存在');
    const content = fs.readFileSync(testFile, 'utf8');
    console.log('   📄 文件大小:', content.length, '字节');

    try {
        const json = JSON.parse(content);
        console.log('   ✅ JSON格式正确');

        if (json.cells && Array.isArray(json.cells)) {
            console.log('   📋 单元格数量:', json.cells.length);
            json.cells.forEach((cell, index) => {
                console.log(`     单元格 ${index}: kind=${cell.kind}, language=${cell.language}`);
            });
        } else {
            console.log('   ❌ 缺少cells数组');
        }
    } catch (error) {
        console.log('   ❌ JSON解析失败:', error.message);
    }
} else {
    console.log('   ❌ 文件不存在');
}

// 2. 检查package.json配置
console.log('\n2. 检查package.json配置:');
const packageJson = require('./package.json');
const notebooks = packageJson.contributes?.notebooks;
if (notebooks && notebooks.length > 0) {
    console.log('   ✅ 笔记本配置存在');
    notebooks.forEach((nb, index) => {
        console.log(`   笔记本 ${index}: type=${nb.type}, displayName=${nb.displayName}`);
        if (nb.selector) {
            nb.selector.forEach((sel, selIndex) => {
                console.log(`     选择器 ${selIndex}: filenamePattern=${sel.filenamePattern}`);
            });
        }
    });
} else {
    console.log('   ❌ 笔记本配置缺失');
}

// 3. 检查WASM文件
console.log('\n3. 检查WASM文件:');
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
    const wasmFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.wasm'));
    console.log('   📁 dist目录WASM文件数量:', wasmFiles.length);

    const requiredWasm = [
        'tree-sitter.wasm',
        'tree-sitter-c_sharp.wasm',
        'tree-sitter-javascript.wasm',
        'tree-sitter-typescript.wasm'
    ];

    requiredWasm.forEach(wasm => {
        if (wasmFiles.includes(wasm)) {
            console.log(`   ✅ ${wasm} 存在`);
        } else {
            console.log(`   ❌ ${wasm} 缺失`);
        }
    });
} else {
    console.log('   ❌ dist目录不存在');
}

// 4. 检查扩展构建状态
console.log('\n4. 检查扩展构建状态:');
const extensionFile = path.join(distDir, 'extension.js');
if (fs.existsSync(extensionFile)) {
    const stats = fs.statSync(extensionFile);
    console.log('   ✅ extension.js 存在');
    console.log('   📊 文件大小:', stats.size, '字节');
    console.log('   🕒 最后修改时间:', stats.mtime.toLocaleString());
} else {
    console.log('   ❌ extension.js 不存在');
}

console.log('\n=== 诊断完成 ===');