import * as vscode from 'vscode';
import { NodeEditorPanel } from './NodeEditorPanel';

/**
 * 拡張機能がアクティベートされたときに呼ばれる
 * @param context 拡張機能コンテキスト
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('NodeEditor拡張機能がアクティベートされました');

    // コマンド: NodeEditorを開く
    const openEditorCommand = vscode.commands.registerCommand(
        'nodeeditor.openEditor',
        async (uri?: vscode.Uri) => {
            try {
                // URIが指定されていない場合は、現在のアクティブエディタから取得
                if (!uri) {
                    const activeEditor = vscode.window.activeTextEditor;
                    if (activeEditor && 
                        (activeEditor.document.languageId === 'shellscript' || 
                         activeEditor.document.fileName.endsWith('.sh') ||
                         activeEditor.document.fileName.endsWith('.bash'))) {
                        uri = activeEditor.document.uri;
                    } else {
                        // ファイル選択ダイアログを表示
                        const fileUris = await vscode.window.showOpenDialog({
                            canSelectFiles: true,
                            canSelectFolders: false,
                            canSelectMany: false,
                            filters: {
                                'Bash Scripts': ['sh', 'bash'],
                                'All Files': ['*']
                            },
                            openLabel: 'NodeEditorで開く'
                        });

                        if (!fileUris || fileUris.length === 0) {
                            return;
                        }
                        uri = fileUris[0];
                    }
                }

                // ファイルの内容を読み込む
                const document = await vscode.workspace.openTextDocument(uri);
                const scriptContent = document.getText();

                // NodeEditorパネルを作成
                vscode.window.showInformationMessage(
                    `NodeEditorで開きます: ${uri.fsPath}\nスクリプトサイズ: ${scriptContent.length}文字`
                );

                // NodeEditorPanelを表示
                NodeEditorPanel.createOrShow(context.extensionUri, document);

            } catch (error) {
                vscode.window.showErrorMessage(
                    `NodeEditorを開く際にエラーが発生しました: ${error}`
                );
            }
        }
    );

    // コマンド: Bashスクリプトをインポート
    const importScriptCommand = vscode.commands.registerCommand(
        'nodeeditor.importScript',
        async () => {
            try {
                // ファイル選択ダイアログを表示
                const fileUris = await vscode.window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectFolders: false,
                    canSelectMany: false,
                    filters: {
                        'Bash Scripts': ['sh', 'bash'],
                        'All Files': ['*']
                    },
                    openLabel: 'スクリプトをインポート'
                });

                if (!fileUris || fileUris.length === 0) {
                    return;
                }

                const uri = fileUris[0];
                const document = await vscode.workspace.openTextDocument(uri);
                const scriptContent = document.getText();

                vscode.window.showInformationMessage(
                    `スクリプトをインポートしました: ${uri.fsPath}`
                );

                // TODO: Phase 4でパーサーを実装
                // const ast = parseBashScript(scriptContent);
                // TODO: Phase 5で変換機能を実装
                // const nodes = convertASTToNodes(ast);

            } catch (error) {
                vscode.window.showErrorMessage(
                    `スクリプトのインポートに失敗しました: ${error}`
                );
            }
        }
    );

    // コマンド: ノードをBashスクリプトにエクスポート
    const exportScriptCommand = vscode.commands.registerCommand(
        'nodeeditor.exportScript',
        async () => {
            try {
                // 保存先を選択
                const uri = await vscode.window.showSaveDialog({
                    filters: {
                        'Bash Scripts': ['sh', 'bash'],
                        'All Files': ['*']
                    },
                    saveLabel: 'スクリプトをエクスポート'
                });

                if (!uri) {
                    return;
                }

                // TODO: Phase 5でノードからスクリプトを生成
                // const script = generateScriptFromNodes(currentNodes);
                const script = '#!/bin/bash\n# NodeEditorで生成されました\n\necho "Hello from NodeEditor!"';

                // ファイルに書き込み
                const encoder = new TextEncoder();
                await vscode.workspace.fs.writeFile(uri, encoder.encode(script));

                vscode.window.showInformationMessage(
                    `スクリプトをエクスポートしました: ${uri.fsPath}`
                );

                // エクスポートしたファイルを開く
                const document = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(document);

            } catch (error) {
                vscode.window.showErrorMessage(
                    `スクリプトのエクスポートに失敗しました: ${error}`
                );
            }
        }
    );

    // コンテキストメニューとファイルエクスプローラーからの起動をサポート
    const contextMenuCommand = vscode.commands.registerCommand(
        'nodeeditor.openFromContext',
        async (uri: vscode.Uri) => {
            await vscode.commands.executeCommand('nodeeditor.openEditor', uri);
        }
    );

    // ステータスバーアイテムを追加
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.text = '$(symbol-structure) NodeEditor';
    statusBarItem.tooltip = '現在のBashスクリプトをNodeEditorで開く';
    statusBarItem.command = 'nodeeditor.openEditor';

    // Bashファイルが開かれているときのみステータスバーを表示
    const updateStatusBar = () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && 
            (activeEditor.document.languageId === 'shellscript' ||
             activeEditor.document.fileName.endsWith('.sh') ||
             activeEditor.document.fileName.endsWith('.bash'))) {
            statusBarItem.show();
        } else {
            statusBarItem.hide();
        }
    };

    // エディタ変更時にステータスバーを更新
    vscode.window.onDidChangeActiveTextEditor(updateStatusBar, null, context.subscriptions);
    updateStatusBar();

    // コマンドとUIアイテムを登録
    context.subscriptions.push(
        openEditorCommand,
        importScriptCommand,
        exportScriptCommand,
        contextMenuCommand,
        statusBarItem
    );

    // 設定値を取得するヘルパー関数
    const getConfiguration = () => {
        const config = vscode.workspace.getConfiguration('nodeeditor');
        return {
            autoSync: config.get<boolean>('autoSync', true),
            syncDelay: config.get<number>('syncDelay', 500),
            theme: config.get<string>('theme', 'auto')
        };
    };

    // 設定変更を監視
    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('nodeeditor')) {
            const config = getConfiguration();
            console.log('NodeEditor設定が変更されました:', config);
            // TODO: Phase 6で設定変更を各コンポーネントに通知
        }
    });

    // 初期設定を取得
    const initialConfig = getConfiguration();
    console.log('NodeEditor初期設定:', initialConfig);

    // WebViewパネルのシリアライザー（状態復元用）
    if (vscode.window.registerWebviewPanelSerializer) {
        vscode.window.registerWebviewPanelSerializer(NodeEditorPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                console.log(`WebViewパネルの状態を復元: ${JSON.stringify(state)}`);
                NodeEditorPanel.revive(webviewPanel, context.extensionUri);
            }
        });
    }
}

/**
 * 拡張機能がディアクティベートされたときに呼ばれる
 */
export function deactivate() {
    console.log('NodeEditor拡張機能がディアクティベートされました');
    // TODO: リソースのクリーンアップ処理を追加
}