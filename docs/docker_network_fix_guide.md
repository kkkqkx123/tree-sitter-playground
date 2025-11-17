# Docker网络连接问题解决方案

## 问题描述

在Windows环境下执行 `npm run build-wasm` 时出现Docker网络连接错误：

```
Unable to find image 'emscripten/emsdk:4.0.4' locally
docker: Error response from daemon: failed to resolve reference "docker.io/emscripten/emsdk:4.0.4": failed to do request: Head "https://registry-1.docker.io/v2/emscripten/emsdk/manifests/4.0.4": dialing registry-1.docker.io:443 container via direct connection because disabled has no HTTPS proxy: connecting to registry-1.docker.io:443: dial tcp [2a03:2880:f136:83:face:b00c:0:25de]:443: connectex: A connection attempt failed because the connected party did not properly respond after a period of time, or established connection failed because connected host has failed to respond.
```

## 问题原因

1. **网络连接问题**：Docker无法连接到Docker Hub镜像仓库
2. **IPv6连接失败**：尝试连接IPv6地址但失败
3. **防火墙或代理设置**：网络环境限制了Docker的访问

## 解决方案

### 方案一：配置Docker镜像加速器（推荐）

#### 1.1 Docker Desktop配置
1. 打开Docker Desktop
2. 进入Settings → Docker Engine
3. 添加以下配置：
```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com",
    "https://registry.docker-cn.com"
  ]
}
```
4. 点击Apply & Restart

#### 1.2 Linux/Mac配置
编辑 `/etc/docker/daemon.json` 文件：
```json
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
```

然后重启Docker服务：
```bash
sudo systemctl restart docker
```

### 方案二：使用本地Emscripten环境

#### 2.1 安装Emscripten SDK
1. 下载Emscripten SDK：
```bash
# 克隆emsdk仓库
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# 安装最新版本
./emsdk install latest
./emsdk activate latest
```

2. 配置环境变量：
```bash
source ./emsdk_env.sh
```

#### 2.2 修改构建脚本
修改 `src/compileWasm.ts`，移除 `--docker` 参数：
```typescript
// 使用本地Emscripten而不是Docker
const command = `${treeSitterCmd} build --wasm "${folderPath}"`;
```

### 方案三：使用预编译WASM文件

#### 3.1 检查现有预编译文件
检查 `node_modules` 中是否已有预编译的WASM文件：
```bash
find node_modules -name "*.wasm" -type f
```

#### 3.2 修改构建流程
创建一个脚本跳过WASM编译，直接复制现有文件：
```typescript
// 在 compileWasm.ts 中添加检查
const existingWasmPath = path.join(folderPath, 'tree-sitter.wasm');
if (await fs.promises.access(existingWasmPath).catch(() => null)) {
    // 直接复制现有文件
    await fs.promises.copyFile(existingWasmPath, path.join(outputPath, `${grammar.name}.wasm`));
    return;
}
```

### 方案四：网络配置修复

#### 4.1 检查网络连接
```bash
# 测试Docker Hub连接
curl -I https://registry-1.docker.io/v2/

# 测试DNS解析
nslookup registry-1.docker.io
```

#### 4.2 配置系统代理
如果使用代理，配置Docker使用代理：
```bash
# 设置环境变量
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
```

#### 4.3 禁用IPv6
如果IPv6连接有问题，可以禁用IPv6：
1. Docker Desktop设置中禁用IPv6
2. 或在系统网络设置中禁用IPv6

### 方案五：使用VPN或替代网络

1. **使用VPN**：连接到可以访问Docker Hub的网络
2. **使用手机热点**：临时使用其他网络环境
3. **配置hosts文件**：手动指定Docker Hub的IP地址

## 推荐实施步骤

### 第一步：尝试镜像加速器
1. 配置Docker镜像加速器（方案一）
2. 重启Docker服务
3. 重新运行构建命令

### 第二步：如果失败，尝试本地环境
1. 安装本地Emscripten SDK（方案二）
2. 修改构建脚本移除Docker依赖
3. 测试本地编译

### 第三步：备选方案
1. 查找预编译WASM文件（方案三）
2. 或修复网络配置（方案四）

## 代码修改建议

为了支持多种构建方式，可以修改 `src/compileWasm.ts`：

```typescript
export async function ensureWasm(grammar: ITreeSitterGrammar, outputPath: string): Promise<void> {
    console.log(`Building ${grammar.name}!`);
    const folderPath = path.join(path.resolve(PROJECT_ROOT, '..'), 'node_modules', grammar.projectPath || grammar.name);

    // Create .build folder if it doesn't exist
    await fs.promises.mkdir(outputPath, { recursive: true });

    // Check for existing WASM file first
    const existingWasmPath = path.join(folderPath, 'tree-sitter.wasm');
    if (await fs.promises.access(existingWasmPath).catch(() => null)) {
        console.log(`Using existing WASM file for ${grammar.name}`);
        await fs.promises.copyFile(existingWasmPath, path.join(outputPath, `${grammar.name}.wasm`));
        return;
    }

    // Determine build method based on environment
    const useDocker = process.env.TREE_SITTER_USE_DOCKER !== 'false';
    const isWindows = os.platform() === 'win32';
    const treeSitterCmd = isWindows ? 'tree-sitter.cmd' : 'tree-sitter';
    
    // Use appropriate command based on environment
    const command = useDocker 
        ? `${treeSitterCmd} build --wasm --docker "${folderPath}"`
        : `${treeSitterCmd} build --wasm "${folderPath}"`;
    
    console.log(`Executing: ${command}`);
    
    try {
        // Execute with appropriate shell for the platform
        if (isWindows) {
            child_process.execSync(command, {
                stdio: 'inherit',
                cwd: path.resolve(PROJECT_ROOT, '..'),
                encoding: 'utf8',
                shell: process.env.comspec || 'cmd.exe'
            });
        } else {
            child_process.execSync(command, {
                stdio: 'inherit',
                cwd: path.resolve(PROJECT_ROOT, '..'),
                encoding: 'utf8',
                shell: '/bin/sh'
            });
        }
    } catch (error) {
        if (useDocker) {
            console.log(`Docker build failed, trying local build...`);
            // Retry without Docker
            const localCommand = `${treeSitterCmd} build --wasm "${folderPath}"`;
            child_process.execSync(localCommand, {
                stdio: 'inherit',
                cwd: path.resolve(PROJECT_ROOT, '..'),
                encoding: 'utf8',
                shell: isWindows ? process.env.comspec || 'cmd.exe' : '/bin/sh'
            });
        } else {
            throw error;
        }
    }

    // ... rest of the file renaming logic
}
```

## 环境变量配置

可以通过环境变量控制构建行为：

```bash
# 禁用Docker，使用本地Emscripten
export TREE_SITTER_USE_DOCKER=false

# 设置代理（如果需要）
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
```

通过这些方案，应该能够解决Docker网络连接问题，成功构建WASM文件。