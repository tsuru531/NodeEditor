import * as vscode from 'vscode';
import { NodeEditorPanel } from './NodeEditorPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('NodeEditor extension is now active!');

    const openEditorCommand = vscode.commands.registerCommand('nodeeditor.openEditor', () => {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            vscode.window.showInformationMessage('開くBashスクリプトファイルがありません。');
            return;
        }

        const document = activeEditor.document;
        
        if (document.languageId !== 'shellscript') {
            vscode.window.showWarningMessage('このファイルはBashスクリプトではありません。');
            return;
        }

        NodeEditorPanel.createOrShow(context.extensionUri, document);
    });

    context.subscriptions.push(openEditorCommand);

    const editorContext = vscode.commands.registerCommand('nodeeditor.openFromContext', (uri: vscode.Uri) => {
        vscode.workspace.openTextDocument(uri).then(document => {
            if (document.languageId !== 'shellscript') {
                vscode.window.showWarningMessage('このファイルはBashスクリプトではありません。');
                return;
            }
            NodeEditorPanel.createOrShow(context.extensionUri, document);
        });
    });

    context.subscriptions.push(editorContext);

    if (vscode.window.registerWebviewPanelSerializer) {
        vscode.window.registerWebviewPanelSerializer(NodeEditorPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                console.log(`Got state: ${state}`);
                NodeEditorPanel.revive(webviewPanel, context.extensionUri);
            }
        });
    }
}

export function deactivate() {
    console.log('NodeEditor extension is now deactivated!');
}