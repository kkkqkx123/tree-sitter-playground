const fs = require('fs');
const path = require('path');

// 必需的WASM文件列表
const requiredWasmFiles = [
    'tree-sitter-c_sharp.wasm',
    'tree-sitter-cpp.wasm',
    'tree-sitter-go.wasm',
    'tree-sitter-java.wasm',
    'tree-sitter-javascript.wasm',
    'tree-sitter-python.wasm',
    'tree-sitter-ruby.wasm',
    'tree-sitter-rust.wasm',
    'tree-sitter-tsx.wasm',
    'tree-sitter-typescript.wasm',
    'tree-sitter.wasm'
];

function checkWasmFiles(directory) {
    console.log(`检查目录: ${directory}`);
    
    if (!fs.existsSync(directory)) {
        console.error(`❌ 目录不存在: ${directory}`);
        return false;
    }
    
    const files = fs.readdirSync(directory);
    const wasmFiles = files.filter(file => file.endsWith('.wasm'));
    
    console.log(`找到 ${wasmFiles.length} 个WASM文件`);
    
    let allFound = true;
    const missingFiles = [];
    
    for (const requiredFile of requiredWasmFiles) {
        const filePath = path.join(directory, requiredFile);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`✅ ${requiredFile} (${(stats.size / 1024).toFixed(1)} KB)`);
        } else {
            console.log(`❌ ${requiredFile} - 缺失`);
            allFound = false;
            missingFiles.push(requiredFile);
        }
    }
    
    if (!allFound) {
        console.error(`\n❌ 缺失文件: ${missingFiles.join(', ')}`);
    } else {
        console.log('\n✅ 所有必需的WASM文件都存在！');
    }
    
    return allFound;
}

// 检查src/.wasm目录
const srcWasmDir = path.join(__dirname, 'src', '.wasm');
console.log('=== 检查源WASM文件 ===');
const srcResult = checkWasmFiles(srcWasmDir);

// 检查dist目录
const distDir = path.join(__dirname, 'dist');
console.log('\n=== 检查构建输出WASM文件 ===');
const distResult = checkWasmFiles(distDir);

// 总体结果
console.log('\n=== 检查结果 ===');
if (srcResult && distResult) {
    console.log('✅ 所有检查通过！扩展应该可以正常加载。');
    process.exit(0);
} else {
    console.log('❌ 检查失败，请修复上述问题。');
    if (!srcResult) {
        console.log('  - 运行: npm run build-wasm');
    }
    if (!distResult) {
        console.log('  - 运行: Copy-Item "src/.wasm/*.wasm" -Destination "dist/"');
        console.log('  - 或: copy src\\.wasm\\*.wasm dist\\');
    }
    process.exit(1);
}