# タスク005: エントリーポイント実装

## 目的
VSCode拡張機能のエントリーポイントと基本的なコマンドハンドラーを実装する

## 前提条件
- タスク004が完了している
- src/extension/ディレクトリが存在する

## 実装内容

### 1. src/extension/extension.tsの作成
```typescript
import * as vscode from 'vscode';
import { NodeEditorPanel } from './NodeEditorPanel';
import { BashScriptWatcher } from '../sync/fileWatcher';

export function activate(context: vscode.ExtensionContext) {
    console.log('Bash Node Editor is now active!');

    // Register open editor command
    const openEditorCommand = vscode.commands.registerCommand(
        'bashNodeEditor.openEditor',
        async (uri?: vscode.Uri) => {
            const fileUri = uri || vscode.window.activeTextEditor?.document.uri;
            
            if (!fileUri) {
                vscode.window.showErrorMessage('No Bash script file selected');
                return;
            }

            // Create or show the node editor panel
            NodeEditorPanel.createOrShow(context.extensionUri, fileUri);
        }
    );

    // Register import script command
    const importScriptCommand = vscode.commands.registerCommand(
        'bashNodeEditor.importScript',
        async () => {
            const options: vscode.OpenDialogOptions = {
                canSelectMany: false,
                openLabel: 'Import',
                filters: {
                    'Bash Scripts': ['sh', 'bash'],
                    'All Files': ['*']
                }
            };

            const fileUri = await vscode.window.showOpenDialog(options);
            if (fileUri && fileUri[0]) {
                NodeEditorPanel.createOrShow(context.extensionUri, fileUri[0]);
            }
        }
    );

    // Register export script command
    const exportScriptCommand = vscode.commands.registerCommand(
        'bashNodeEditor.exportScript',
        async () => {
            const panel = NodeEditorPanel.currentPanel;
            if (!panel) {
                vscode.window.showErrorMessage('No active node editor');
                return;
            }
            
            panel.exportToScript();
        }
    );

    // Register all commands
    context.subscriptions.push(
        openEditorCommand,
        importScriptCommand,
        exportScriptCommand
    );

    // Set up file watcher for auto-sync
    const config = vscode.workspace.getConfiguration('bashNodeEditor');
    if (config.get<boolean>('autoSync')) {
        const watcher = new BashScriptWatcher();
        context.subscriptions.push(watcher);
    }
}

export function deactivate() {
    console.log('Bash Node Editor is now deactivated');
}
```

### 2. src/extension/NodeEditorPanel.tsの基本実装
```typescript
import * as vscode from 'vscode';
import * as path from 'path';

export class NodeEditorPanel {
    public static currentPanel: NodeEditorPanel | undefined;
    private static readonly viewType = 'bashNodeEditor';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _scriptUri: vscode.Uri;

    public static createOrShow(extensionUri: vscode.Uri, scriptUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If panel exists, reveal it
        if (NodeEditorPanel.currentPanel) {
            NodeEditorPanel.currentPanel._panel.reveal(column);
            NodeEditorPanel.currentPanel.loadScript(scriptUri);
            return;
        }

        // Create new panel
        const panel = vscode.window.createWebviewPanel(
            NodeEditorPanel.viewType,
            'Bash Node Editor',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'dist'),
                    vscode.Uri.joinPath(extensionUri, 'resources')
                ]
            }
        );

        NodeEditorPanel.currentPanel = new NodeEditorPanel(
            panel,
            extensionUri,
            scriptUri
        );
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        scriptUri: vscode.Uri
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._scriptUri = scriptUri;

        // Set the webview's initial html content
        this._update();

        // Listen for panel disposal
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'saveScript':
                        this.saveScript(message.content);
                        break;
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    public loadScript(scriptUri: vscode.Uri) {
        this._scriptUri = scriptUri;
        // TODO: Read script content and send to webview
    }

    public exportToScript() {
        // TODO: Get nodes from webview and generate script
    }

    private saveScript(content: string) {
        // TODO: Save script content to file
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.title = `Node Editor: ${path.basename(this._scriptUri.fsPath)}`;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // TODO: Return proper HTML with React app
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Bash Node Editor</title>
            </head>
            <body>
                <div id="root"></div>
                <h1>Node Editor Placeholder</h1>
            </body>
            </html>`;
    }

    public dispose() {
        NodeEditorPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
```

## 成果物
- src/extension/extension.ts
- src/extension/NodeEditorPanel.ts

## テスト方法
1. `npm run compile` でコンパイルが成功することを確認
2. F5でデバッグ実行し、拡張機能がアクティベートされることを確認
3. コマンドパレットからコマンドが実行できることを確認

## 完了条件
- [ ] extension.tsが作成されている
- [ ] アクティベート関数が実装されている
- [ ] コマンドハンドラーが登録されている
- [ ] NodeEditorPanelクラスが基本実装されている
- [ ] コンパイルエラーがない