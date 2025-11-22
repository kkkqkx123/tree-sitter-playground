import * as vscode from 'vscode';

export class NotebookSerializer implements vscode.NotebookSerializer {
	static queryLanguageId = 'scm';
	createNew(): vscode.NotebookData {
		const queryCell = new vscode.NotebookCellData(vscode.NotebookCellKind.Code, '(identifier) @identifier', NotebookSerializer.queryLanguageId);
		const sourceCodeCell = new vscode.NotebookCellData(vscode.NotebookCellKind.Code, 'const x = 1;', 'javascript');
		return new vscode.NotebookData([sourceCodeCell, queryCell]);
	}

	serializeNotebook(data: vscode.NotebookData, token?: vscode.CancellationToken): Uint8Array {
		const cells = data.cells.map((cell) => {
			return { code: cell.value, language: cell.languageId, kind: cell.kind === vscode.NotebookCellKind.Markup ? 'markdown' : 'code' };
		});
		return new TextEncoder().encode(JSON.stringify({ cells }));
	}

	deserializeNotebook(content: Uint8Array, token: vscode.CancellationToken): vscode.NotebookData {
		console.log('[TreeSitter Notebook] Starting deserialization, content length:', content.length);

		// Handle empty content by creating a new notebook
		if (content.length === 0) {
			console.log('[TreeSitter Notebook] Empty content detected, creating new notebook');
			return this.createNew();
		}

		try {
			// Parse existing content
			const stringified = new TextDecoder().decode(content);
			console.log('[TreeSitter Notebook] Decoded content:', stringified.substring(0, 200) + (stringified.length > 200 ? '...' : ''));

			let data: any;
			try {
				data = JSON.parse(stringified);
				console.log('[TreeSitter Notebook] JSON parsed successfully');
			} catch (parseError) {
				console.error('[TreeSitter Notebook] JSON parsing failed:', parseError);
				throw new Error(`Unable to parse notebook content: Invalid JSON format. ${parseError}`);
			}

			if (!data || typeof data !== 'object') {
				throw new Error('Unable to parse notebook content: Root element must be an object.');
			}

			if (!('cells' in data)) {
				console.error('[TreeSitter Notebook] Missing cells property in data');
				throw new Error('Unable to parse provided notebook content, missing required `cells` property.');
			}

			if (!Array.isArray(data.cells)) {
				console.error('[TreeSitter Notebook] Cells property is not an array:', typeof data.cells);
				throw new Error('Unable to parse notebook contents, `cells` is not an array.');
			}

			console.log('[TreeSitter Notebook] Processing', data.cells.length, 'cells');

			const cells: vscode.NotebookCellData[] = data.cells
				.map((cell: any, index: number) => {
					console.log(`[TreeSitter Notebook] Processing cell ${index}:`, JSON.stringify(cell).substring(0, 100));

					if (typeof cell !== 'object' || cell === null) {
						console.warn(`[TreeSitter Notebook] Skipping cell ${index}: not an object`);
						return null;
					}

					// Validate required properties
					if (!cell.hasOwnProperty('code')) {
						console.warn(`[TreeSitter Notebook] Skipping cell ${index}: missing 'code' property`);
						return null;
					}

					if (!cell.hasOwnProperty('kind')) {
						console.warn(`[TreeSitter Notebook] Skipping cell ${index}: missing 'kind' property`);
						return null;
					}

					const cellKind = cell.kind === 'code' ? vscode.NotebookCellKind.Code : vscode.NotebookCellKind.Markup;
					const language = cell.kind === 'code' ? (cell.language ?? NotebookSerializer.queryLanguageId) : 'markdown';

					console.log(`[TreeSitter Notebook] Creating cell ${index}: kind=${cell.kind}, language=${language}`);
					return new vscode.NotebookCellData(cellKind, String(cell.code), language);
				})
				.filter((cell: vscode.NotebookCellData | null): cell is vscode.NotebookCellData => {
					if (cell === null) {
						return false;
					}
					// Additional validation
					if (!cell.value || typeof cell.value !== 'string') {
						console.warn('[TreeSitter Notebook] Skipping cell: invalid value');
						return false;
					}
					if (!cell.languageId || typeof cell.languageId !== 'string') {
						console.warn('[TreeSitter Notebook] Skipping cell: invalid language');
						return false;
					}
					return true;
				});

			console.log('[TreeSitter Notebook] Successfully processed', cells.length, 'valid cells');

			if (cells.length === 0) {
				console.warn('[TreeSitter Notebook] No valid cells found, creating default notebook');
				return this.createNew();
			}

			return new vscode.NotebookData(cells);

		} catch (error) {
			console.error('[TreeSitter Notebook] Deserialization failed:', error);
			// Provide a more helpful error message
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to load Tree-sitter Notebook: ${errorMessage}`);
		}
	}
}