import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const PROJECT_ROOT = __dirname;

export interface ITreeSitterGrammar {
	name: string;
	/**
	 * A custom .wasm filename if the grammar node module doesn't follow the standard naming convention
	 */
	filename?: string;
	/**
	 * The path where we should spawn `tree-sitter build-wasm`
	 */
	projectPath?: string;
}

export async function ensureWasm(grammar: ITreeSitterGrammar, outputPath: string): Promise<void> {
	console.log(`Building ${grammar.name}!`);
	const folderPath = path.join(path.resolve(PROJECT_ROOT, '..'), 'node_modules', grammar.projectPath || grammar.name);

	// Create .build folder if it doesn't exist
	await fs.promises.mkdir(outputPath, { recursive: true });

	// Determine the correct path for tree-sitter binary based on OS
	// On Windows, npm creates .cmd files; on Unix, it creates shell scripts
	const isWindows = os.platform() === 'win32';
	const treeSitterCmd = isWindows ? 'tree-sitter.cmd' : 'tree-sitter';
	
	// Use cross-platform command execution - use correct command: build --wasm --docker
	const command = `${treeSitterCmd} build --wasm --docker "${folderPath}"`;
	
	console.log(`Executing: ${command}`);
	
	// Execute with appropriate shell for the platform
	if (isWindows) {
		// On Windows, use the system shell to handle .cmd files properly
		child_process.execSync(command, {
			stdio: 'inherit',
			cwd: path.resolve(PROJECT_ROOT, '..'), // Execute from project root
			encoding: 'utf8',
			shell: process.env.comspec || 'cmd.exe' // Use Windows command processor
		});
	} else {
		// On Unix systems, execute directly or use bash
		child_process.execSync(command, {
			stdio: 'inherit',
			cwd: path.resolve(PROJECT_ROOT, '..'), // Execute from project root
			encoding: 'utf8',
			shell: '/bin/sh' // Use standard shell on Unix
		});
	}

	// The WASM file is generated in the current directory, move it to the output directory
	const currentDir = path.resolve(PROJECT_ROOT, '..');
	const wasmFiles = await fs.promises.readdir(currentDir);
	const generatedWasmFile = wasmFiles.find(file => file.endsWith('.wasm') && file.includes(grammar.name.replace('tree-sitter-', '')));
	
	if (generatedWasmFile) {
		const sourcePath = path.join(currentDir, generatedWasmFile);
		const targetName = grammar.filename || `${grammar.name}.wasm`;
		const targetPath = path.join(outputPath, targetName);
		
		console.log(`Moving ${sourcePath} to ${targetPath}`);
		await fs.promises.rename(sourcePath, targetPath);
	} else {
		console.error(`Warning: No WASM file generated for ${grammar.name}`);
	}
}