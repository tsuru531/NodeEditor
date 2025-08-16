import * as vscode from 'vscode';
import { ProjectManager } from '../project/ProjectManager';

/**
 * 拡張機能がアクティベートされたときに呼ばれる
 * @param context 拡張機能コンテキスト
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('NodeCanvas拡張機能がアクティベートされました');

    // プロジェクトマネージャーのインスタンスを取得
    const projectManager = ProjectManager.getInstance();

    // コマンド: 新しいプロジェクトを作成
    const newProjectCommand = vscode.commands.registerCommand(
        'nodecanvas.newProject',
        async () => {
            try {
                await projectManager.createNewProject();
                vscode.window.showInformationMessage('新しいプロジェクトを作成しました');
            } catch (error) {
                vscode.window.showErrorMessage(`プロジェクト作成エラー: ${error}`);
            }
        }
    );

    // コマンド: プロジェクトを開く
    const openProjectCommand = vscode.commands.registerCommand(
        'nodecanvas.openProject',
        async () => {
            try {
                await projectManager.openProject();
            } catch (error) {
                vscode.window.showErrorMessage(`プロジェクトを開けませんでした: ${error}`);
            }
        }
    );

    // コマンド: プロジェクトを保存
    const saveProjectCommand = vscode.commands.registerCommand(
        'nodecanvas.saveProject',
        async () => {
            try {
                const config = vscode.workspace.getConfiguration('nodecanvas');
                const autoBackup = config.get<boolean>('autoBackup', true);
                
                await projectManager.saveProject(undefined, { 
                    createBackup: autoBackup 
                });
            } catch (error) {
                vscode.window.showErrorMessage(`プロジェクト保存エラー: ${error}`);
            }
        }
    );

    // コマンド: プロジェクトを名前を付けて保存
    const saveProjectAsCommand = vscode.commands.registerCommand(
        'nodecanvas.saveProjectAs',
        async () => {
            try {
                const config = vscode.workspace.getConfiguration('nodecanvas');
                const autoBackup = config.get<boolean>('autoBackup', true);
                
                await projectManager.saveProjectAs({ 
                    createBackup: autoBackup 
                });
            } catch (error) {
                vscode.window.showErrorMessage(`プロジェクト保存エラー: ${error}`);
            }
        }
    );

    // コマンド: プロジェクトを閉じる
    const closeProjectCommand = vscode.commands.registerCommand(
        'nodecanvas.closeProject',
        async () => {
            try {
                const closed = await projectManager.closeProject();
                if (closed) {
                    vscode.window.showInformationMessage('プロジェクトを閉じました');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`プロジェクトを閉じる際にエラーが発生しました: ${error}`);
            }
        }
    );

    // コマンド: 最近使用したプロジェクトを開く
    const openRecentProjectCommand = vscode.commands.registerCommand(
        'nodecanvas.openRecentProject',
        async () => {
            try {
                const recentProjects = projectManager.getRecentProjects();
                
                if (recentProjects.length === 0) {
                    vscode.window.showInformationMessage('最近使用したプロジェクトはありません');
                    return;
                }

                const items = recentProjects.map(projectPath => ({
                    label: vscode.workspace.asRelativePath(projectPath),
                    description: projectPath,
                    detail: `最終使用: ${new Date().toLocaleDateString()}`,
                    projectPath
                }));

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: '最近使用したプロジェクトを選択'
                });

                if (selected) {
                    await projectManager.openProject(selected.projectPath);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`プロジェクトを開けませんでした: ${error}`);
            }
        }
    );

    // コマンド: NodeCanvasを開く
    const openCanvasCommand = vscode.commands.registerCommand(
        'nodecanvas.openCanvas',
        async (uri?: vscode.Uri) => {
            try {
                // URIが指定されていない場合の処理
                if (!uri) {
                    const activeEditor = vscode.window.activeTextEditor;
                    if (activeEditor) {
                        // 現在開いているファイルがあればそれを使用（ファイルタイプ制限なし）
                        uri = activeEditor.document.uri;
                    } else {
                        // アクティブエディタがない場合の選択肢を提示
                        const choice = await vscode.window.showQuickPick([
                            {
                                label: '$(file) 既存ファイルを開く',
                                description: 'ファイルを選択してNodeCanvasで開く',
                                action: 'openFile'
                            },
                            {
                                label: '$(add) 新規キャンバス',
                                description: 'ファイルなしで新規キャンバスを作成',
                                action: 'newCanvas'
                            }
                        ], {
                            placeHolder: 'NodeCanvasの開き方を選択してください'
                        });

                        if (!choice) {
                            return;
                        }

                        if (choice.action === 'openFile') {
                            // ファイル選択ダイアログを表示
                            const fileUris = await vscode.window.showOpenDialog({
                                canSelectFiles: true,
                                canSelectFolders: false,
                                canSelectMany: false,
                                filters: {
                                    'All Files': ['*'],
                                    'Text Files': ['txt', 'md', 'json', 'yaml', 'yml'],
                                    'Script Files': ['sh', 'bash', 'py', 'js', 'ts'],
                                    'Config Files': ['conf', 'config', 'ini', 'env']
                                },
                                openLabel: 'NodeCanvasで開く'
                            });

                            if (!fileUris || fileUris.length === 0) {
                                return;
                            }
                            uri = fileUris[0];
                        }
                        // choice.action === 'newCanvas' の場合はuriをnullのままにして新規キャンバス
                    }
                }

                // ファイルの内容を読み込む（uriがある場合のみ）
                let document: vscode.TextDocument | undefined;
                if (uri) {
                    document = await vscode.workspace.openTextDocument(uri);
                }

                // NodeCanvasパネルを作成
                const { NodeCanvasPanel } = await import('./NodeCanvasPanel');
                NodeCanvasPanel.createOrShow(context.extensionUri, document);

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
    statusBarItem.tooltip = 'NodeCanvasビジュアルエディタを開く';
    statusBarItem.command = 'nodecanvas.openCanvas';
    
    // 常時ステータスバーを表示
    statusBarItem.show();

    // コマンドとUIアイテムを登録
    context.subscriptions.push(
        newProjectCommand,
        openProjectCommand,
        saveProjectCommand,
        saveProjectAsCommand,
        closeProjectCommand,
        openRecentProjectCommand,
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
    if (vscode.window.registerWebviewPanelSerializer) {
        vscode.window.registerWebviewPanelSerializer('nodeCanvas', {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
                console.log(`WebViewパネルの状態を復元: ${JSON.stringify(state)}`);
                const { NodeCanvasPanel } = await import('./NodeCanvasPanel');
                NodeCanvasPanel.revive(webviewPanel, context.extensionUri);
            }
        });
    }
}

/**
 * 拡張機能がディアクティベートされたときに呼ばれる
 */
export function deactivate() {
    console.log('NodeCanvas拡張機能がディアクティベートされました');
    // TODO: リソースのクリーンアップ処理を追加
}