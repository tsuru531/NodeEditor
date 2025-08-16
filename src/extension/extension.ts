import * as vscode from 'vscode';

/**
 * 拡張機能がアクティベートされたときに呼ばれる
 * @param context 拡張機能コンテキスト
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('NodeCanvas拡張機能がアクティベートされました');

    // コマンド: NodeCanvasを開く
    const openCanvasCommand = vscode.commands.registerCommand(
        'nodecanvas.openCanvas',
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
                            openLabel: 'NodeCanvasで開く'
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

                // NodeCanvasパネルを作成（今後実装）
                vscode.window.showInformationMessage(
                    `NodeCanvasで開きます: ${uri.fsPath}\nスクリプトサイズ: ${scriptContent.length}文字`
                );

                // TODO: Canvas Phase 2で NodeCanvasPanelクラスを実装
                // const { NodeCanvasPanel } = await import('./NodeCanvasPanel');
                // NodeCanvasPanel.createOrShow(context.extensionUri, document);

            } catch (error) {
                vscode.window.showErrorMessage(
                    `NodeCanvasを開く際にエラーが発生しました: ${error}`
                );
            }
        }
    );

    // コマンド: 関数をインポート
    const importFunctionCommand = vscode.commands.registerCommand(
        'nodecanvas.importFunction',
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
                    openLabel: '関数をインポート'
                });

                if (!fileUris || fileUris.length === 0) {
                    return;
                }

                const uri = fileUris[0];
                const document = await vscode.workspace.openTextDocument(uri);
                const scriptContent = document.getText();

                vscode.window.showInformationMessage(
                    `関数をインポートしました: ${uri.fsPath}`
                );

                // TODO: Canvas Phase 3でbash関数パーサーを実装
                // const functions = parseBashFunctions(scriptContent);
                // TODO: Canvas Phase 2でBashFunctionNodeを実装
                // const nodes = createBashFunctionNodes(functions);

            } catch (error) {
                vscode.window.showErrorMessage(
                    `関数のインポートに失敗しました: ${error}`
                );
            }
        }
    );

    // コマンド: ワークフローをエクスポート
    const exportWorkflowCommand = vscode.commands.registerCommand(
        'nodecanvas.exportWorkflow',
        async () => {
            try {
                // 保存先を選択
                const uri = await vscode.window.showSaveDialog({
                    filters: {
                        'Bash Scripts': ['sh', 'bash'],
                        'All Files': ['*']
                    },
                    saveLabel: 'ワークフローをエクスポート'
                });

                if (!uri) {
                    return;
                }

                // TODO: Canvas Phase 3でワークフローからスクリプトを生成
                // const script = generateWorkflowScript(currentWorkflow);
                const script = '#!/bin/bash\n# NodeCanvasで生成されました\n\necho "Hello from NodeCanvas!"';

                // ファイルに書き込み
                const encoder = new TextEncoder();
                await vscode.workspace.fs.writeFile(uri, encoder.encode(script));

                vscode.window.showInformationMessage(
                    `ワークフローをエクスポートしました: ${uri.fsPath}`
                );

                // エクスポートしたファイルを開く
                const document = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(document);

            } catch (error) {
                vscode.window.showErrorMessage(
                    `ワークフローのエクスポートに失敗しました: ${error}`
                );
            }
        }
    );

    // コンテキストメニューとファイルエクスプローラーからの起動をサポート
    const contextMenuCommand = vscode.commands.registerCommand(
        'nodecanvas.openFromContext',
        async (uri: vscode.Uri) => {
            await vscode.commands.executeCommand('nodecanvas.openCanvas', uri);
        }
    );

    // ステータスバーアイテムを追加
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.text = '$(symbol-structure) NodeCanvas';
    statusBarItem.tooltip = '現在のBashスクリプトをNodeCanvasで開く';
    statusBarItem.command = 'nodecanvas.openCanvas';

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
        openCanvasCommand,
        importFunctionCommand,
        exportWorkflowCommand,
        contextMenuCommand,
        statusBarItem
    );

    // 設定値を取得するヘルパー関数
    const getConfiguration = () => {
        const config = vscode.workspace.getConfiguration('nodecanvas');
        return {
            autoSave: config.get<boolean>('autoSave', true),
            gridSnap: config.get<boolean>('gridSnap', false),
            theme: config.get<string>('theme', 'auto'),
            defaultNodeType: config.get<string>('defaultNodeType', 'memo')
        };
    };

    // 設定変更を監視
    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('nodecanvas')) {
            const config = getConfiguration();
            console.log('NodeCanvas設定が変更されました:', config);
            // TODO: Canvas Phase 4で設定変更を各コンポーネントに通知
        }
    });

    // 初期設定を取得
    const initialConfig = getConfiguration();
    console.log('NodeCanvas初期設定:', initialConfig);

    // WebViewパネルのシリアライザー（状態復元用）
    // TODO: Canvas Phase 2でNodeCanvasPanelを実装後に有効化
    // if (vscode.window.registerWebviewPanelSerializer) {
    //     vscode.window.registerWebviewPanelSerializer(NodeCanvasPanel.viewType, {
    //         async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
    //             console.log(`WebViewパネルの状態を復元: ${JSON.stringify(state)}`);
    //             NodeCanvasPanel.revive(webviewPanel, context.extensionUri, state);
    //         }
    //     });
    // }
}

/**
 * 拡張機能がディアクティベートされたときに呼ばれる
 */
export function deactivate() {
    console.log('NodeCanvas拡張機能がディアクティベートされました');
    // TODO: リソースのクリーンアップ処理を追加
}