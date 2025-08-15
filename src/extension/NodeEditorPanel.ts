import * as vscode from 'vscode';
import * as path from 'path';

export class NodeEditorPanel {
    public static currentPanel: NodeEditorPanel | undefined;
    public static readonly viewType = 'nodeEditor';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _document: vscode.TextDocument;

    public static createOrShow(extensionUri: vscode.Uri, document: vscode.TextDocument) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (NodeEditorPanel.currentPanel) {
            NodeEditorPanel.currentPanel._panel.reveal(column);
            NodeEditorPanel.currentPanel._document = document;
            NodeEditorPanel.currentPanel._update();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            NodeEditorPanel.viewType,
            'Node Editor',
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

        NodeEditorPanel.currentPanel = new NodeEditorPanel(panel, extensionUri, document);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            NodeEditorPanel.currentPanel = new NodeEditorPanel(panel, extensionUri, activeEditor.document);
        }
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, document: vscode.TextDocument) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._document = document;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'updateScript':
                        this._updateDocument(message.script);
                        return;
                    case 'getScript':
                        this._sendScriptToWebview();
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
                if (e.document.uri.toString() === this._document.uri.toString()) {
                    this._sendScriptToWebview();
                }
            },
            null,
            this._disposables
        );
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

    private _update() {
        const webview = this._panel.webview;
        this._panel.title = `Node Editor: ${path.basename(this._document.fileName)}`;
        this._panel.webview.html = this._getHtmlForWebview(webview);
        this._sendScriptToWebview();
    }

    private _sendScriptToWebview() {
        const script = this._document.getText();
        this._panel.webview.postMessage({
            command: 'setScript',
            script: script
        });
    }

    private async _updateDocument(newScript: string) {
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            this._document.positionAt(0),
            this._document.positionAt(this._document.getText().length)
        );
        edit.replace(this._document.uri, fullRange, newScript);
        await vscode.workspace.applyEdit(edit);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'out', 'webview', 'index.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'style.css'));

        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-eval'; img-src ${webview.cspSource} data: https:; font-src ${webview.cspSource};">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>Node Editor</title>
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    window.vscode = vscode;
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