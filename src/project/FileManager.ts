/**
 * FileNodeのファイル管理とファイル監視機能
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * ファイル情報
 */
export interface FileInfo {
    filePath: string;
    exists: boolean;
    size?: number;
    lastModified?: Date;
    hash?: string;
    content?: string;
    syncStatus: 'synced' | 'modified' | 'missing' | 'error';
}

/**
 * ファイル変更イベント
 */
export interface FileChangeEvent {
    nodeId: string;
    filePath: string;
    changeType: 'created' | 'modified' | 'deleted';
    fileInfo?: FileInfo;
}

/**
 * ファイル管理クラス
 */
export class FileManager {
    private static instance: FileManager;
    private watchers = new Map<string, vscode.FileSystemWatcher>();
    private fileCache = new Map<string, FileInfo>();
    private nodeFileMap = new Map<string, string>(); // nodeId -> filePath
    private changeCallbacks = new Set<(event: FileChangeEvent) => void>();

    private constructor() {}

    /**
     * シングルトンインスタンスの取得
     */
    static getInstance(): FileManager {
        if (!FileManager.instance) {
            FileManager.instance = new FileManager();
        }
        return FileManager.instance;
    }

    /**
     * ファイル変更イベントのリスナーを追加
     */
    onFileChange(callback: (event: FileChangeEvent) => void): void {
        this.changeCallbacks.add(callback);
    }

    /**
     * ファイル変更イベントのリスナーを削除
     */
    offFileChange(callback: (event: FileChangeEvent) => void): void {
        this.changeCallbacks.delete(callback);
    }

    /**
     * ノードのファイル監視を開始
     */
    async watchFile(nodeId: string, filePath: string, workspaceRoot?: string): Promise<void> {
        try {
            // 既存の監視を停止
            this.unwatchFile(nodeId);

            // ファイルパスの正規化
            const normalizedPath = this.normalizePath(filePath, workspaceRoot);
            this.nodeFileMap.set(nodeId, normalizedPath);

            // ファイル情報を初期取得
            const fileInfo = await this.getFileInfo(normalizedPath);
            this.fileCache.set(normalizedPath, fileInfo);

            // ファイル監視の設定
            const watcher = vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(
                    path.dirname(normalizedPath),
                    path.basename(normalizedPath)
                )
            );

            // ファイル変更イベント
            watcher.onDidChange(async (uri) => {
                await this.handleFileChange(nodeId, uri.fsPath, 'modified');
            });

            // ファイル作成イベント
            watcher.onDidCreate(async (uri) => {
                await this.handleFileChange(nodeId, uri.fsPath, 'created');
            });

            // ファイル削除イベント
            watcher.onDidDelete(async (uri) => {
                await this.handleFileChange(nodeId, uri.fsPath, 'deleted');
            });

            this.watchers.set(nodeId, watcher);

        } catch (error) {
            console.error(`ファイル監視の開始に失敗: ${filePath}`, error);
            throw error;
        }
    }

    /**
     * ノードのファイル監視を停止
     */
    unwatchFile(nodeId: string): void {
        const watcher = this.watchers.get(nodeId);
        if (watcher) {
            watcher.dispose();
            this.watchers.delete(nodeId);
        }

        const filePath = this.nodeFileMap.get(nodeId);
        if (filePath) {
            this.nodeFileMap.delete(nodeId);
            this.fileCache.delete(filePath);
        }
    }

    /**
     * ファイル情報を取得
     */
    async getFileInfo(filePath: string): Promise<FileInfo> {
        try {
            const stats = await fs.stat(filePath);
            const content = await fs.readFile(filePath, 'utf8');
            const hash = this.calculateHash(content);

            return {
                filePath,
                exists: true,
                size: stats.size,
                lastModified: stats.mtime,
                hash,
                content: content.length <= 1000 ? content : content.substring(0, 1000) + '...',
                syncStatus: 'synced'
            };

        } catch (error) {
            return {
                filePath,
                exists: false,
                syncStatus: 'missing'
            };
        }
    }

    /**
     * ファイル状態をチェック
     */
    async checkFileStatus(nodeId: string): Promise<FileInfo | null> {
        const filePath = this.nodeFileMap.get(nodeId);
        if (!filePath) {
            return null;
        }

        const currentInfo = await this.getFileInfo(filePath);
        const cachedInfo = this.fileCache.get(filePath);

        if (cachedInfo && cachedInfo.hash !== currentInfo.hash) {
            currentInfo.syncStatus = 'modified';
        }

        this.fileCache.set(filePath, currentInfo);
        return currentInfo;
    }

    /**
     * ファイル内容を読み込み
     */
    async loadFileContent(filePath: string, workspaceRoot?: string): Promise<string> {
        try {
            const normalizedPath = this.normalizePath(filePath, workspaceRoot);
            const content = await fs.readFile(normalizedPath, 'utf8');
            return content;
        } catch (error) {
            throw new Error(`ファイルの読み込みに失敗: ${filePath} - ${error}`);
        }
    }

    /**
     * ファイルを開く
     */
    async openFile(filePath: string, workspaceRoot?: string): Promise<void> {
        try {
            const normalizedPath = this.normalizePath(filePath, workspaceRoot);
            const uri = vscode.Uri.file(normalizedPath);
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);
        } catch (error) {
            throw new Error(`ファイルを開けませんでした: ${filePath} - ${error}`);
        }
    }

    /**
     * ファイル選択ダイアログを表示
     */
    async selectFile(): Promise<string | undefined> {
        const fileUris = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'All Files': ['*'],
                'Text Files': ['txt', 'md', 'json', 'yaml', 'yml'],
                'Script Files': ['sh', 'bash', 'py', 'js', 'ts'],
                'Config Files': ['conf', 'config', 'ini', 'env']
            }
        });

        if (fileUris && fileUris.length > 0) {
            return fileUris[0].fsPath;
        }
        return undefined;
    }

    /**
     * 相対パスを絶対パスに変換
     */
    private normalizePath(filePath: string, workspaceRoot?: string): string {
        if (path.isAbsolute(filePath)) {
            return filePath;
        }

        if (workspaceRoot) {
            return path.resolve(workspaceRoot, filePath);
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            return path.resolve(workspaceFolders[0].uri.fsPath, filePath);
        }

        throw new Error('ワークスペースが開かれていないため、相対パスを解決できません');
    }

    /**
     * ファイル内容のハッシュを計算
     */
    private calculateHash(content: string): string {
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * ファイル変更イベントの処理
     */
    private async handleFileChange(nodeId: string, filePath: string, changeType: 'created' | 'modified' | 'deleted'): Promise<void> {
        try {
            let fileInfo: FileInfo | undefined;

            if (changeType !== 'deleted') {
                fileInfo = await this.getFileInfo(filePath);
                this.fileCache.set(filePath, fileInfo);
            } else {
                fileInfo = {
                    filePath,
                    exists: false,
                    syncStatus: 'missing'
                };
                this.fileCache.delete(filePath);
            }

            const event: FileChangeEvent = {
                nodeId,
                filePath,
                changeType,
                fileInfo
            };

            // コールバックを実行
            this.changeCallbacks.forEach(callback => {
                try {
                    callback(event);
                } catch (error) {
                    console.error('ファイル変更コールバックエラー:', error);
                }
            });

        } catch (error) {
            console.error('ファイル変更イベントの処理に失敗:', error);
        }
    }

    /**
     * すべての監視を停止
     */
    dispose(): void {
        this.watchers.forEach(watcher => watcher.dispose());
        this.watchers.clear();
        this.fileCache.clear();
        this.nodeFileMap.clear();
        this.changeCallbacks.clear();
    }

    /**
     * ファイルの相対パス変換
     */
    getRelativePath(filePath: string, workspaceRoot?: string): string {
        if (!workspaceRoot) {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                workspaceRoot = workspaceFolders[0].uri.fsPath;
            }
        }

        if (workspaceRoot && filePath.startsWith(workspaceRoot)) {
            return path.relative(workspaceRoot, filePath);
        }

        return filePath;
    }

    /**
     * ファイルをBase64エンコード
     */
    async embedFile(filePath: string, workspaceRoot?: string): Promise<string> {
        try {
            const normalizedPath = this.normalizePath(filePath, workspaceRoot);
            const content = await fs.readFile(normalizedPath);
            return content.toString('base64');
        } catch (error) {
            throw new Error(`ファイルの埋め込みに失敗: ${filePath} - ${error}`);
        }
    }

    /**
     * Base64デコードしてファイルに保存
     */
    async extractEmbeddedFile(base64Content: string, outputPath: string): Promise<void> {
        try {
            const content = Buffer.from(base64Content, 'base64');
            await fs.writeFile(outputPath, content);
        } catch (error) {
            throw new Error(`埋め込みファイルの展開に失敗: ${outputPath} - ${error}`);
        }
    }
}