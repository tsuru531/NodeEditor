import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';

export class NodeCanvasPanel {
    public static currentPanel: NodeCanvasPanel | undefined;
    public static readonly viewType = 'nodeCanvas';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _document?: vscode.TextDocument;

    public static createOrShow(extensionUri: vscode.Uri, document?: vscode.TextDocument) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (NodeCanvasPanel.currentPanel) {
            NodeCanvasPanel.currentPanel._panel.reveal(column);
            if (document) {
                NodeCanvasPanel.currentPanel._document = document;
            }
            NodeCanvasPanel.currentPanel._update();
            return;
        }

        // パネルタイトルを動的に決定
        const panelTitle = document ? 
            `NodeCanvas - ${path.basename(document.uri.fsPath)}` : 
            'NodeCanvas - 新規キャンバス';

        const panel = vscode.window.createWebviewPanel(
            NodeCanvasPanel.viewType,
            panelTitle,
            column || vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'out'),
                    vscode.Uri.joinPath(extensionUri, 'resources')
                ]
            }
        );

        NodeCanvasPanel.currentPanel = new NodeCanvasPanel(panel, extensionUri, document);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        const activeEditor = vscode.window.activeTextEditor;
        NodeCanvasPanel.currentPanel = new NodeCanvasPanel(panel, extensionUri, activeEditor?.document);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, document?: vscode.TextDocument) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._document = document;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'saveCanvas':
                        this._saveCanvas(message.data);
                        return;
                    case 'loadCanvas':
                        this._loadCanvas();
                        return;
                    case 'updateScript':
                        if (this._document) {
                            this._updateDocument(message.script);
                        }
                        return;
                    case 'executeBashFunction':
                        this._executeBashFunction(message);
                        return;
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );

        vscode.workspace.onDidChangeTextDocument(
            e => {
                if (this._document && e.document.uri.toString() === this._document.uri.toString()) {
                    this._sendScriptToWebview();
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        NodeCanvasPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.title = this._document 
            ? `NodeCanvas - ${path.basename(this._document.fileName)}`
            : 'NodeCanvas - 新規キャンバス';
        this._panel.webview.html = this._getHtmlForWebview(webview);
        this._sendScriptToWebview();
    }

    private _sendScriptToWebview() {
        if (!this._document) return;
        
        const script = this._document.getText();
        this._panel.webview.postMessage({
            command: 'setScript',
            script: script
        });
    }

    private async _updateDocument(newScript: string) {
        if (!this._document) return;
        
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            this._document.positionAt(0),
            this._document.positionAt(this._document.getText().length)
        );
        edit.replace(this._document.uri, fullRange, newScript);
        await vscode.workspace.applyEdit(edit);
    }

    private async _saveCanvas(canvasData: any) {
        // TODO: Canvas Phase 5でキャンバスプロジェクト保存機能を実装
        vscode.window.showInformationMessage('キャンバスデータを保存しました（将来実装）');
    }

    private async _loadCanvas() {
        // TODO: Canvas Phase 5でキャンバスプロジェクト読み込み機能を実装
        vscode.window.showInformationMessage('キャンバスデータを読み込みました（将来実装）');
    }

    private async _executeBashFunction(message: any) {
        try {
            const { functionBody, arguments: args, nodeId } = message;
            
            // bashコマンドを構築
            let bashCommand = functionBody;
            
            // 引数を順番に置換 ($1, $2, ...)
            if (args && Array.isArray(args)) {
                args.forEach((arg: string, index: number) => {
                    const placeholder = `$${index + 1}`;
                    bashCommand = bashCommand.replace(new RegExp(`\\${placeholder}\\b`, 'g'), arg);
                });
            }
            
            // bashプロセスを実行
            const bashProcess = spawn('bash', ['-c', bashCommand], {
                cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
                env: process.env
            });
            
            let stdout = '';
            let stderr = '';
            
            bashProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            bashProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            bashProcess.on('close', (code) => {
                // WebViewに結果を送信
                this._panel.webview.postMessage({
                    command: 'bashExecutionResult',
                    success: true,
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    exitCode: code || 0,
                    nodeId
                });
            });
            
            bashProcess.on('error', (error) => {
                // エラーをWebViewに送信
                this._panel.webview.postMessage({
                    command: 'bashExecutionResult',
                    success: false,
                    error: error.message,
                    nodeId
                });
            });
            
            // 10秒でタイムアウト
            setTimeout(() => {
                if (!bashProcess.killed) {
                    bashProcess.kill('SIGTERM');
                    this._panel.webview.postMessage({
                        command: 'bashExecutionResult',
                        success: false,
                        error: 'Execution timeout (10s)',
                        nodeId
                    });
                }
            }, 10000);
            
        } catch (error) {
            // エラーをWebViewに送信
            this._panel.webview.postMessage({
                command: 'bashExecutionResult',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'index.js'));

        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-eval'; img-src ${webview.cspSource} data:; font-src ${webview.cspSource};">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Node Canvas</title>
            </head>
            <body class="vscode-dark">
                <div id="root"></div>
                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    window.vscode = vscode;
                    
                    // VSCodeテーマクラスを設定
                    const theme = document.body.classList.contains('vscode-light') ? 'light' : 'dark';
                    if (theme === 'dark' && !document.body.classList.contains('vscode-dark')) {
                        document.body.classList.add('vscode-dark');
                    }
                </script>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}