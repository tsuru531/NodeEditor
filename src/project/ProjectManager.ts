/**
 * NodeCanvasプロジェクトの管理機能
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ProjectSerializer } from './ProjectSerializer';
import { 
    NodeCanvasProject, 
    WorkflowDefinition, 
    ProjectSaveOptions, 
    ProjectLoadOptions,
    FileReference
} from './types';

/**
 * プロジェクト管理クラス
 */
export class ProjectManager {
    private static readonly EXTENSION = '.nodecanvas';
    private static instance: ProjectManager;
    
    private currentProject: NodeCanvasProject | null = null;
    private currentProjectPath: string | null = null;
    private fileWatcher: vscode.FileSystemWatcher | null = null;
    private isDirty = false;

    private constructor() {}

    /**
     * シングルトンインスタンスの取得
     */
    static getInstance(): ProjectManager {
        if (!ProjectManager.instance) {
            ProjectManager.instance = new ProjectManager();
        }
        return ProjectManager.instance;
    }

    /**
     * 新しいプロジェクトを作成
     */
    async createNewProject(name?: string): Promise<NodeCanvasProject> {
        const projectName = name || await this.promptForProjectName();
        if (!projectName) {
            throw new Error('プロジェクト名が必要です');
        }

        this.currentProject = ProjectSerializer.createDefaultProject(projectName);
        this.currentProjectPath = null;
        this.isDirty = true;

        await this.notifyProjectChanged();
        return this.currentProject;
    }

    /**
     * プロジェクトを開く
     */
    async openProject(filePath?: string): Promise<NodeCanvasProject> {
        let targetPath = filePath;
        
        if (!targetPath) {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'NodeCanvas Projects': ['nodecanvas'],
                    'All Files': ['*']
                },
                openLabel: 'プロジェクトを開く'
            });

            if (!fileUri || fileUri.length === 0) {
                throw new Error('ファイルが選択されませんでした');
            }
            targetPath = fileUri[0].fsPath;
        }

        try {
            const fileContent = await fs.readFile(targetPath, 'utf8');
            const options: ProjectLoadOptions = {
                validateFiles: true,
                ignoreMissingFiles: false,
                autoRepair: true
            };

            this.currentProject = ProjectSerializer.deserialize(fileContent, targetPath, options);
            this.currentProjectPath = targetPath;
            this.isDirty = false;

            await this.setupFileWatcher();
            await this.notifyProjectChanged();

            vscode.window.showInformationMessage(`プロジェクトを開きました: ${path.basename(targetPath)}`);
            return this.currentProject;

        } catch (error) {
            const errorMessage = `プロジェクトを開けませんでした: ${error}`;
            vscode.window.showErrorMessage(errorMessage);
            throw new Error(errorMessage);
        }
    }

    /**
     * プロジェクトを保存
     */
    async saveProject(filePath?: string, options: ProjectSaveOptions = {}): Promise<void> {
        if (!this.currentProject) {
            throw new Error('保存するプロジェクトがありません');
        }

        let targetPath = filePath || this.currentProjectPath;

        // ファイルパスが指定されていない場合は保存ダイアログを表示
        if (!targetPath) {
            const fileUri = await vscode.window.showSaveDialog({
                filters: {
                    'NodeCanvas Projects': ['nodecanvas']
                },
                saveLabel: 'プロジェクトを保存',
                defaultUri: vscode.Uri.file(`${this.currentProject.metadata.name}${ProjectManager.EXTENSION}`)
            });

            if (!fileUri) {
                throw new Error('保存がキャンセルされました');
            }
            targetPath = fileUri.fsPath;
        }

        try {
            // バックアップの作成
            if (options.createBackup && await this.fileExists(targetPath)) {
                const backupPath = `${targetPath}.backup`;
                await fs.copyFile(targetPath, backupPath);
            }

            // プロジェクトのシリアライズと保存
            const serializedData = ProjectSerializer.serialize(this.currentProject, options);
            await fs.writeFile(targetPath, serializedData, 'utf8');

            this.currentProjectPath = targetPath;
            this.isDirty = false;

            await this.setupFileWatcher();
            vscode.window.showInformationMessage(`プロジェクトを保存しました: ${path.basename(targetPath)}`);

        } catch (error) {
            const errorMessage = `プロジェクトの保存に失敗しました: ${error}`;
            vscode.window.showErrorMessage(errorMessage);
            throw new Error(errorMessage);
        }
    }

    /**
     * プロジェクトを名前を付けて保存
     */
    async saveProjectAs(options: ProjectSaveOptions = {}): Promise<void> {
        await this.saveProject(undefined, options);
    }

    /**
     * プロジェクトを閉じる
     */
    async closeProject(): Promise<boolean> {
        if (this.isDirty) {
            const choice = await vscode.window.showWarningMessage(
                '保存されていない変更があります。保存しますか？',
                { modal: true },
                '保存',
                '保存しない',
                'キャンセル'
            );

            switch (choice) {
                case '保存':
                    await this.saveProject();
                    break;
                case 'キャンセル':
                    return false;
                case '保存しない':
                default:
                    break;
            }
        }

        this.currentProject = null;
        this.currentProjectPath = null;
        this.isDirty = false;

        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = null;
        }

        await this.notifyProjectChanged();
        return true;
    }

    /**
     * 現在のプロジェクトを取得
     */
    getCurrentProject(): NodeCanvasProject | null {
        return this.currentProject;
    }

    /**
     * 現在のプロジェクトパスを取得
     */
    getCurrentProjectPath(): string | null {
        return this.currentProjectPath;
    }

    /**
     * プロジェクトが変更されているかチェック
     */
    isDirtyProject(): boolean {
        return this.isDirty;
    }

    /**
     * プロジェクトを更新
     */
    updateProject(project: NodeCanvasProject): void {
        this.currentProject = project;
        this.isDirty = true;
        this.notifyProjectChanged();
    }

    /**
     * ワークフローを更新
     */
    updateWorkflow(workflowId: string, workflow: WorkflowDefinition): void {
        if (!this.currentProject) {
            return;
        }

        const index = this.currentProject.workflows.findIndex(w => w.id === workflowId);
        if (index !== -1) {
            this.currentProject.workflows[index] = {
                ...workflow,
                updatedAt: new Date()
            };
            this.isDirty = true;
            this.notifyProjectChanged();
        }
    }

    /**
     * ワークフローを追加
     */
    addWorkflow(workflow: WorkflowDefinition): void {
        if (!this.currentProject) {
            return;
        }

        this.currentProject.workflows.push(workflow);
        this.isDirty = true;
        this.notifyProjectChanged();
    }

    /**
     * ワークフローを削除
     */
    removeWorkflow(workflowId: string): void {
        if (!this.currentProject) {
            return;
        }

        this.currentProject.workflows = this.currentProject.workflows.filter(w => w.id !== workflowId);
        
        // アクティブワークフローが削除された場合の処理
        if (this.currentProject.activeWorkflowId === workflowId) {
            this.currentProject.activeWorkflowId = this.currentProject.workflows.length > 0 
                ? this.currentProject.workflows[0].id 
                : undefined;
        }

        this.isDirty = true;
        this.notifyProjectChanged();
    }

    /**
     * アクティブワークフローを設定
     */
    setActiveWorkflow(workflowId: string): void {
        if (!this.currentProject) {
            return;
        }

        if (this.currentProject.workflows.some(w => w.id === workflowId)) {
            this.currentProject.activeWorkflowId = workflowId;
            this.isDirty = true;
            this.notifyProjectChanged();
        }
    }

    /**
     * ファイル監視の設定
     */
    private async setupFileWatcher(): Promise<void> {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }

        if (!this.currentProjectPath) {
            return;
        }

        const pattern = new vscode.RelativePattern(
            path.dirname(this.currentProjectPath),
            '**/*'
        );

        this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
        
        this.fileWatcher.onDidChange((uri) => {
            if (uri.fsPath === this.currentProjectPath) {
                this.handleProjectFileChanged();
            } else {
                this.handleReferencedFileChanged(uri.fsPath);
            }
        });

        this.fileWatcher.onDidDelete((uri) => {
            this.handleReferencedFileDeleted(uri.fsPath);
        });
    }

    /**
     * プロジェクトファイル変更の処理
     */
    private async handleProjectFileChanged(): Promise<void> {
        if (this.isDirty) {
            const choice = await vscode.window.showWarningMessage(
                'プロジェクトファイルが外部で変更されました。ファイルを再読み込みしますか？（保存されていない変更は失われます）',
                '再読み込み',
                '無視'
            );

            if (choice === '再読み込み') {
                await this.openProject(this.currentProjectPath!);
            }
        }
    }

    /**
     * 参照ファイル変更の処理
     */
    private handleReferencedFileChanged(filePath: string): void {
        if (!this.currentProject) {
            return;
        }

        // 参照ファイルの更新通知をWebViewに送信
        vscode.window.showInformationMessage(
            `参照ファイルが変更されました: ${path.basename(filePath)}`
        );
    }

    /**
     * 参照ファイル削除の処理
     */
    private handleReferencedFileDeleted(filePath: string): void {
        if (!this.currentProject) {
            return;
        }

        vscode.window.showWarningMessage(
            `参照ファイルが削除されました: ${path.basename(filePath)}`
        );
    }

    /**
     * プロジェクト名の入力プロンプト
     */
    private async promptForProjectName(): Promise<string | undefined> {
        return await vscode.window.showInputBox({
            prompt: 'プロジェクト名を入力してください',
            placeHolder: 'My NodeCanvas Project',
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'プロジェクト名は必須です';
                }
                if (value.length > 100) {
                    return 'プロジェクト名は100文字以内で入力してください';
                }
                return null;
            }
        });
    }

    /**
     * ファイル存在チェック
     */
    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * プロジェクト変更通知
     */
    private async notifyProjectChanged(): Promise<void> {
        // WebViewパネルに変更を通知する処理
        // 実装は NodeCanvasPanel で行う
    }

    /**
     * 最近使用したプロジェクトの管理
     */
    async addToRecentProjects(projectPath: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('nodecanvas');
        const recentProjects: string[] = config.get('recentProjects', []);
        
        // 既存のパスを削除
        const filteredProjects = recentProjects.filter(p => p !== projectPath);
        
        // 先頭に追加
        const updatedProjects = [projectPath, ...filteredProjects].slice(0, 10); // 最大10件
        
        await config.update('recentProjects', updatedProjects, vscode.ConfigurationTarget.Global);
    }

    /**
     * 最近使用したプロジェクトを取得
     */
    getRecentProjects(): string[] {
        const config = vscode.workspace.getConfiguration('nodecanvas');
        return config.get('recentProjects', []);
    }
}