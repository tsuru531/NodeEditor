import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';
import { ProjectManager } from '../project/ProjectManager';
import { FileManager } from '../project/FileManager';
import { TemplateManager } from '../project/TemplateManager';
import { BashImporter } from '../project/BashImporter';
import { BashExporter } from '../project/BashExporter';

export class NodeCanvasPanel {
    public static currentPanel: NodeCanvasPanel | undefined;
    public static readonly viewType = 'nodeCanvas';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _document?: vscode.TextDocument;
    private readonly _projectManager: ProjectManager;
    private readonly _fileManager: FileManager;
    private readonly _templateManager: TemplateManager;

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
        
        // マネージャーの初期化
        this._projectManager = ProjectManager.getInstance();
        this._fileManager = FileManager.getInstance();
        this._templateManager = TemplateManager.getInstance();
        
        // テンプレートマネージャーの初期化
        this._templateManager.initialize().catch(error => {
            console.error('テンプレートマネージャーの初期化に失敗:', error);
        });

        this._update();
        this._setupEventHandlers();

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
                    case 'selectFile':
                        this._handleSelectFile(message);
                        return;
                    case 'loadFilePreview':
                        this._handleLoadFilePreview(message);
                        return;
                    case 'openFile':
                        this._handleOpenFile(message);
                        return;
                    case 'checkFileStatus':
                        this._handleCheckFileStatus(message);
                        return;
                    case 'updateFileNodeSettings':
                        this._handleUpdateFileNodeSettings(message);
                        return;
                    case 'importBashScript':
                        this._handleImportBashScript(message);
                        return;
                    case 'exportToScript':
                        this._handleExportToScript(message);
                        return;
                    case 'applyTemplate':
                        this._handleApplyTemplate(message);
                        return;
                    case 'createTemplate':
                        this._handleCreateTemplate(message);
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

    /**
     * イベントハンドラーのセットアップ
     */
    private _setupEventHandlers(): void {
        // ファイル変更イベントのリスナー
        this._fileManager.onFileChange((event) => {
            this._panel.webview.postMessage({
                type: 'fileStatusUpdate',
                nodeId: event.nodeId,
                syncStatus: event.fileInfo?.syncStatus || 'error',
                lastModified: event.fileInfo?.lastModified,
                fileSize: event.fileInfo?.size,
                previewContent: event.fileInfo?.content
            });
        });
    }

    public dispose() {
        NodeCanvasPanel.currentPanel = undefined;

        // マネージャーの破棄
        this._fileManager.dispose();

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
            
            console.log('=== NODECANVASPANEL DEBUG ===');
            console.log('Received message:', message);
            console.log('Received functionBody:', functionBody);
            console.log('Received arguments:', args);
            console.log('Node ID:', nodeId);
            
            // 環境変数として引数を設定
            const env = { ...process.env };
            if (args && Array.isArray(args)) {
                args.forEach((arg: string, index: number) => {
                    env[`ARG${index + 1}`] = arg;
                });
            }
            
            // bash関数を定義してから実行するスクリプトを作成
            let bashScript = functionBody;
            
            // 引数がある場合は、$1, $2, ... を適切に設定
            if (args && Array.isArray(args) && args.length > 0) {
                // 引数をスクリプトに渡すため、set -- を使用
                const quotedArgs = args.map(arg => `'${arg.replace(/'/g, "'\"'\"'")}'`).join(' ');
                bashScript = `set -- ${quotedArgs}\n${functionBody}`;
            }
            
            console.log('Final bashScript to execute:');
            console.log(bashScript);
            console.log('========================');
            
            // bashプロセスを実行
            const bashProcess = spawn('bash', ['-c', bashScript], {
                cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
                env: env
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

    /**
     * ファイル選択ハンドラー
     */
    private async _handleSelectFile(message: any): Promise<void> {
        try {
            const filePath = await this._fileManager.selectFile();
            if (filePath) {
                this._panel.webview.postMessage({
                    type: 'fileSelected',
                    nodeId: message.nodeId,
                    filePath: filePath
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`ファイル選択エラー: ${error}`);
        }
    }

    /**
     * ファイルプレビュー読み込みハンドラー
     */
    private async _handleLoadFilePreview(message: any): Promise<void> {
        try {
            const content = await this._fileManager.loadFileContent(message.filePath);
            this._panel.webview.postMessage({
                type: 'fileContentUpdate',
                nodeId: message.nodeId,
                content: content.substring(0, 1000) // プレビューは最初の1000文字のみ
            });
        } catch (error) {
            vscode.window.showErrorMessage(`ファイル読み込みエラー: ${error}`);
        }
    }

    /**
     * ファイルを開くハンドラー
     */
    private async _handleOpenFile(message: any): Promise<void> {
        try {
            await this._fileManager.openFile(message.filePath);
        } catch (error) {
            vscode.window.showErrorMessage(`ファイルを開けませんでした: ${error}`);
        }
    }

    /**
     * ファイル状態チェックハンドラー
     */
    private async _handleCheckFileStatus(message: any): Promise<void> {
        try {
            const fileInfo = await this._fileManager.checkFileStatus(message.nodeId);
            if (fileInfo) {
                this._panel.webview.postMessage({
                    type: 'fileStatusUpdate',
                    nodeId: message.nodeId,
                    syncStatus: fileInfo.syncStatus,
                    lastModified: fileInfo.lastModified,
                    fileSize: fileInfo.size,
                    previewContent: fileInfo.content
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`ファイル状態確認エラー: ${error}`);
        }
    }

    /**
     * FileNode設定更新ハンドラー
     */
    private async _handleUpdateFileNodeSettings(message: any): Promise<void> {
        try {
            if (message.autoSync && message.filePath) {
                await this._fileManager.watchFile(message.nodeId, message.filePath);
            } else {
                this._fileManager.unwatchFile(message.nodeId);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`ファイル監視設定エラー: ${error}`);
        }
    }

    /**
     * Bashスクリプトインポートハンドラー
     */
    private async _handleImportBashScript(message: any): Promise<void> {
        try {
            const result = await BashImporter.importFromScript(message.scriptContent, message.options);
            this._panel.webview.postMessage({
                type: 'bashImportResult',
                result: result
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Bashインポートエラー: ${error}`);
        }
    }

    /**
     * スクリプトエクスポートハンドラー
     */
    private async _handleExportToScript(message: any): Promise<void> {
        try {
            const result = await BashExporter.exportToScript(message.nodes, message.edges, message.options);
            
            // ファイル保存ダイアログを表示
            const uri = await vscode.window.showSaveDialog({
                filters: {
                    'Bash Scripts': ['sh', 'bash'],
                    'All Files': ['*']
                }
            });

            if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(result.script, 'utf8'));
                vscode.window.showInformationMessage(`スクリプトをエクスポートしました: ${uri.fsPath}`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`エクスポートエラー: ${error}`);
        }
    }

    /**
     * テンプレート適用ハンドラー
     */
    private async _handleApplyTemplate(message: any): Promise<void> {
        try {
            const result = await this._templateManager.applyTemplate(
                message.templateId,
                message.parameters,
                message.position
            );
            
            this._panel.webview.postMessage({
                type: 'templateApplied',
                result: result
            });
        } catch (error) {
            vscode.window.showErrorMessage(`テンプレート適用エラー: ${error}`);
        }
    }

    /**
     * テンプレート作成ハンドラー
     */
    private async _handleCreateTemplate(message: any): Promise<void> {
        try {
            const template = await this._templateManager.createTemplateFromSelection(
                message.nodes,
                message.edges,
                message.templateInfo
            );
            
            this._panel.webview.postMessage({
                type: 'templateCreated',
                template: template
            });
            
            vscode.window.showInformationMessage(`テンプレート「${template.name}」を作成しました`);
        } catch (error) {
            vscode.window.showErrorMessage(`テンプレート作成エラー: ${error}`);
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