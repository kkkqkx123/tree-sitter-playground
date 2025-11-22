import * as vscode from 'vscode';
import { Parser } from 'web-tree-sitter';
import { createNotebookController } from './controller';
import { NodeTypesDefinitionProvider } from './nodeTypesDefinitionProvider';
import { NodeTypesOutlineProvider } from './nodeTypesOutlineProvider';
import { createParseTreeEditorCommand } from './parseTreeEditor';
import { QueryDiagnosticsProvider } from './queryDiagnosticsProvider';
import { NotebookSerializer } from './serializer';
import { WASMLanguage } from './treeSitter';

declare var navigator: object | undefined;

export async function activate(context: vscode.ExtensionContext) {
	console.log('[TreeSitter Extension] Activating extension...');

	try {
		const serializer = new NotebookSerializer();
		console.log('[TreeSitter Extension] Created notebook serializer');

		const controller = createNotebookController(context.extensionUri);
		controller.supportedLanguages = [NotebookSerializer.queryLanguageId, ...Object.values(WASMLanguage)];
		console.log('[TreeSitter Extension] Created notebook controller');

		// We only need to provide these options when running in the web worker
		const options: object | undefined = typeof navigator === 'undefined'
			? undefined
			: {
				locateFile() {
					return vscode.Uri.joinPath(context.extensionUri, 'dist', 'tree-sitter.wasm').toString(true);
				}
			};
		await Parser.init(options);
		console.log('[TreeSitter Extension] Parser initialized');

		const queryDiagnosticsProvider = new QueryDiagnosticsProvider(context.extensionUri);
		await queryDiagnosticsProvider.init();
		console.log('[TreeSitter Extension] Query diagnostics provider initialized');

		// Register notebook serializer with error handling
		const serializerRegistration = vscode.workspace.registerNotebookSerializer('tree-sitter-query', serializer);
		console.log('[TreeSitter Extension] Registered notebook serializer');

		context.subscriptions.push(
			serializerRegistration,
			vscode.commands.registerCommand('vscode-treesitter-notebook.new', async () => {
				console.log('[TreeSitter Extension] Creating new notebook...');
				try {
					const data = serializer.createNew();
					const notebookDocument = await vscode.workspace.openNotebookDocument("tree-sitter-query", data);
					await vscode.commands.executeCommand("vscode.openWith", notebookDocument.uri, "tree-sitter-query");
					console.log('[TreeSitter Extension] New notebook created successfully');
				} catch (error) {
					console.error('[TreeSitter Extension] Failed to create new notebook:', error);
					vscode.window.showErrorMessage(`Failed to create Tree-sitter Notebook: ${error}`);
				}
			}),
			queryDiagnosticsProvider,
			vscode.commands.registerCommand('vscode-treesitter-parse-tree-editor.createToSide', () => createParseTreeEditorCommand(context)),
			vscode.languages.registerDocumentSymbolProvider(
				{ pattern: '**/node-types.json' },
				new NodeTypesOutlineProvider(),
				{ label: 'Tree-Sitter Node Types' }
			),
			vscode.languages.registerDefinitionProvider(
				{ pattern: '**/node-types.json' },
				new NodeTypesDefinitionProvider(),
			),
		);

		console.log('[TreeSitter Extension] Extension activated successfully');

	} catch (error) {
		console.error('[TreeSitter Extension] Failed to activate extension:', error);
		vscode.window.showErrorMessage(`Tree-sitter Extension activation failed: ${error}`);
		throw error;
	}
}

// This method is called when your extension is deactivated
export function deactivate() { }
