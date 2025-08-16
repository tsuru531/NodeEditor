/**
 * NodeCanvasプロジェクトファイル(.nodecanvas)の型定義
 */

import { Node, Edge } from 'reactflow';

/**
 * プロジェクトファイルのメタデータ
 */
export interface ProjectMetadata {
    /** プロジェクト名 */
    name: string;
    /** プロジェクトの説明 */
    description?: string;
    /** 作成日時 */
    createdAt: Date;
    /** 最終更新日時 */
    updatedAt: Date;
    /** プロジェクトバージョン */
    version: string;
    /** 作成者情報 */
    author?: string;
    /** プロジェクトのタグ */
    tags?: string[];
}

/**
 * キャンバスの設定情報
 */
export interface CanvasSettings {
    /** キャンバスの背景色 */
    backgroundColor?: string;
    /** グリッドの表示設定 */
    gridEnabled: boolean;
    /** グリッドサイズ */
    gridSize: number;
    /** スナップ機能の有効/無効 */
    snapToGrid: boolean;
    /** ズームレベル */
    zoomLevel: number;
    /** ビューポート位置 */
    viewportPosition: { x: number; y: number };
}

/**
 * ファイル参照情報
 */
export interface FileReference {
    /** ファイルパス（プロジェクトフォルダからの相対パス） */
    path: string;
    /** ファイルの種類 */
    type: 'relative' | 'absolute' | 'embedded';
    /** 埋め込みファイルの場合のBase64エンコードされたコンテンツ */
    embeddedContent?: string;
    /** ファイルのハッシュ値（整合性チェック用） */
    hash?: string;
    /** 最終同期日時 */
    lastSync?: Date;
}

/**
 * ワークフロー定義
 */
export interface WorkflowDefinition {
    /** ワークフローID */
    id: string;
    /** ワークフロー名 */
    name: string;
    /** ワークフローの説明 */
    description?: string;
    /** ノード配列 */
    nodes: Node[];
    /** エッジ（接続）配列 */
    edges: Edge[];
    /** キャンバス設定 */
    canvasSettings: CanvasSettings;
    /** 参照ファイル一覧 */
    fileReferences: FileReference[];
    /** ワークフロー固有の変数 */
    variables?: Record<string, any>;
    /** 作成日時 */
    createdAt: Date;
    /** 最終更新日時 */
    updatedAt: Date;
}

/**
 * NodeCanvasプロジェクトファイルの完全な定義
 */
export interface NodeCanvasProject {
    /** プロジェクトメタデータ */
    metadata: ProjectMetadata;
    /** ワークフロー配列（複数のキャンバスをサポート） */
    workflows: WorkflowDefinition[];
    /** アクティブなワークフローID */
    activeWorkflowId?: string;
    /** プロジェクト全体の設定 */
    projectSettings?: {
        /** デフォルトのキャンバス設定 */
        defaultCanvasSettings: CanvasSettings;
        /** ノードのデフォルト設定 */
        defaultNodeSettings?: Record<string, any>;
        /** テーマ設定 */
        theme?: 'light' | 'dark' | 'auto';
    };
    /** 使用しているテンプレート情報 */
    templates?: TemplateReference[];
}

/**
 * テンプレート参照
 */
export interface TemplateReference {
    /** テンプレートID */
    id: string;
    /** テンプレート名 */
    name: string;
    /** テンプレートバージョン */
    version: string;
    /** テンプレートのパス */
    path?: string;
    /** 使用しているノードタイプ */
    nodeTypes: string[];
}

/**
 * プロジェクトファイルの検証エラー
 */
export interface ProjectValidationError {
    /** エラーの種類 */
    type: 'metadata' | 'workflow' | 'file' | 'node' | 'edge';
    /** エラーメッセージ */
    message: string;
    /** エラーの詳細位置 */
    location?: {
        workflowId?: string;
        nodeId?: string;
        edgeId?: string;
        field?: string;
    };
    /** 修正可能かどうか */
    autoFixable: boolean;
}

/**
 * プロジェクトの保存オプション
 */
export interface ProjectSaveOptions {
    /** 圧縮するかどうか */
    compress?: boolean;
    /** バックアップを作成するかどうか */
    createBackup?: boolean;
    /** 相対パスを絶対パスに変換するかどうか */
    resolveRelativePaths?: boolean;
    /** ファイルを埋め込むかどうか */
    embedFiles?: boolean;
}

/**
 * プロジェクトの読み込みオプション
 */
export interface ProjectLoadOptions {
    /** ファイルの整合性をチェックするかどうか */
    validateFiles?: boolean;
    /** 不足ファイルを無視するかどうか */
    ignoreMissingFiles?: boolean;
    /** 自動修復を試すかどうか */
    autoRepair?: boolean;
    /** ワークフローを選択的に読み込むかどうか */
    selectiveLoad?: string[];
}