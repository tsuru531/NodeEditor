/**
 * NodeCanvasプロジェクトのシリアライズ・デシリアライズ機能
 */

import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import {
    NodeCanvasProject,
    WorkflowDefinition,
    FileReference,
    ProjectValidationError,
    ProjectSaveOptions,
    ProjectLoadOptions,
    ProjectMetadata,
    CanvasSettings
} from './types';

/**
 * プロジェクトシリアライザークラス
 */
export class ProjectSerializer {
    private static readonly FORMAT_VERSION = '1.0.0';
    private static readonly MAGIC_BYTES = 'NODECANVAS';

    /**
     * プロジェクトをJSON文字列にシリアライズ
     */
    static serialize(project: NodeCanvasProject, options: ProjectSaveOptions = {}): string {
        try {
            // メタデータの更新
            const updatedProject: NodeCanvasProject = {
                ...project,
                metadata: {
                    ...project.metadata,
                    updatedAt: new Date(),
                    version: this.FORMAT_VERSION
                }
            };

            // ファイル参照の処理
            if (options.embedFiles) {
                updatedProject.workflows = updatedProject.workflows.map(workflow => 
                    this.embedFilesInWorkflow(workflow, options)
                );
            }

            // JSON化前の前処理
            const serializedData = {
                magic: this.MAGIC_BYTES,
                version: this.FORMAT_VERSION,
                project: updatedProject,
                savedAt: new Date(),
                options: options
            };

            // JSON文字列化
            let jsonString = JSON.stringify(serializedData, this.dateReplacer, 2);

            // 圧縮オプション
            if (options.compress) {
                // 実際の実装では zlib などを使用
                console.log('圧縮は将来実装予定');
            }

            return jsonString;

        } catch (error) {
            throw new Error(`プロジェクトのシリアライズに失敗しました: ${error}`);
        }
    }

    /**
     * JSON文字列からプロジェクトをデシリアライズ
     */
    static deserialize(jsonString: string, projectPath: string, options: ProjectLoadOptions = {}): NodeCanvasProject {
        try {
            // JSON パース
            const data = JSON.parse(jsonString, this.dateReviver);

            // マジックバイトとバージョンチェック
            if (data.magic !== this.MAGIC_BYTES) {
                throw new Error('不正なプロジェクトファイル形式です');
            }

            if (!this.isCompatibleVersion(data.version)) {
                throw new Error(`サポートされていないプロジェクトバージョンです: ${data.version}`);
            }

            const project: NodeCanvasProject = data.project;

            // ファイル参照の検証と復元
            if (options.validateFiles) {
                project.workflows = project.workflows.map(workflow => 
                    this.validateWorkflowFiles(workflow, projectPath, options)
                );
            }

            // プロジェクトの検証
            const validationErrors = this.validateProject(project);
            if (validationErrors.length > 0 && !options.autoRepair) {
                throw new Error(`プロジェクト検証エラー: ${validationErrors.map(e => e.message).join(', ')}`);
            }

            // 自動修復
            if (options.autoRepair && validationErrors.length > 0) {
                return this.repairProject(project, validationErrors);
            }

            return project;

        } catch (error) {
            throw new Error(`プロジェクトのデシリアライズに失敗しました: ${error}`);
        }
    }

    /**
     * ワークフローにファイルを埋め込み
     */
    private static embedFilesInWorkflow(workflow: WorkflowDefinition, options: ProjectSaveOptions): WorkflowDefinition {
        const updatedWorkflow = { ...workflow };
        
        updatedWorkflow.fileReferences = workflow.fileReferences.map(fileRef => {
            if (fileRef.type === 'relative' || fileRef.type === 'absolute') {
                try {
                    const filePath = fileRef.type === 'absolute' ? fileRef.path : path.resolve(process.cwd(), fileRef.path);
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    const hash = crypto.createHash('sha256').update(fileContent).digest('hex');

                    return {
                        ...fileRef,
                        type: 'embedded' as const,
                        embeddedContent: Buffer.from(fileContent).toString('base64'),
                        hash,
                        lastSync: new Date()
                    };
                } catch (error) {
                    console.warn(`ファイルの埋め込みに失敗: ${fileRef.path}`);
                    return fileRef;
                }
            }
            return fileRef;
        });

        return updatedWorkflow;
    }

    /**
     * ワークフローのファイル参照を検証
     */
    private static validateWorkflowFiles(workflow: WorkflowDefinition, projectPath: string, options: ProjectLoadOptions): WorkflowDefinition {
        const updatedWorkflow = { ...workflow };
        
        updatedWorkflow.fileReferences = workflow.fileReferences.map(fileRef => {
            if (fileRef.type === 'embedded') {
                // 埋め込みファイルはそのまま使用
                return fileRef;
            }

            try {
                const fullPath = path.isAbsolute(fileRef.path) 
                    ? fileRef.path 
                    : path.resolve(path.dirname(projectPath), fileRef.path);

                if (!fs.existsSync(fullPath)) {
                    if (options.ignoreMissingFiles) {
                        console.warn(`ファイルが見つかりません（無視）: ${fileRef.path}`);
                        return fileRef;
                    } else {
                        throw new Error(`ファイルが見つかりません: ${fileRef.path}`);
                    }
                }

                // ファイルハッシュの検証
                const fileContent = fs.readFileSync(fullPath, 'utf8');
                const currentHash = crypto.createHash('sha256').update(fileContent).digest('hex');
                
                if (fileRef.hash && fileRef.hash !== currentHash) {
                    console.warn(`ファイルが変更されています: ${fileRef.path}`);
                }

                return {
                    ...fileRef,
                    hash: currentHash,
                    lastSync: new Date()
                };

            } catch (error) {
                if (options.ignoreMissingFiles) {
                    console.warn(`ファイル検証エラー（無視）: ${fileRef.path} - ${error}`);
                    return fileRef;
                } else {
                    throw error;
                }
            }
        });

        return updatedWorkflow;
    }

    /**
     * プロジェクトの検証
     */
    private static validateProject(project: NodeCanvasProject): ProjectValidationError[] {
        const errors: ProjectValidationError[] = [];

        // メタデータの検証
        if (!project.metadata.name || project.metadata.name.trim() === '') {
            errors.push({
                type: 'metadata',
                message: 'プロジェクト名が設定されていません',
                autoFixable: true
            });
        }

        // ワークフローの検証
        project.workflows.forEach(workflow => {
            if (!workflow.id || workflow.id.trim() === '') {
                errors.push({
                    type: 'workflow',
                    message: `ワークフローIDが設定されていません: ${workflow.name}`,
                    location: { workflowId: workflow.id },
                    autoFixable: true
                });
            }

            // ノードとエッジの整合性チェック
            const nodeIds = new Set(workflow.nodes.map(node => node.id));
            workflow.edges.forEach(edge => {
                if (!nodeIds.has(edge.source)) {
                    errors.push({
                        type: 'edge',
                        message: `存在しないノードを参照しています: ${edge.source}`,
                        location: { workflowId: workflow.id, edgeId: edge.id },
                        autoFixable: false
                    });
                }
                if (!nodeIds.has(edge.target)) {
                    errors.push({
                        type: 'edge',
                        message: `存在しないノードを参照しています: ${edge.target}`,
                        location: { workflowId: workflow.id, edgeId: edge.id },
                        autoFixable: false
                    });
                }
            });
        });

        return errors;
    }

    /**
     * プロジェクトの自動修復
     */
    private static repairProject(project: NodeCanvasProject, errors: ProjectValidationError[]): NodeCanvasProject {
        const repairedProject = { ...project };

        errors.forEach(error => {
            if (!error.autoFixable) {
                return;
            }

            switch (error.type) {
                case 'metadata':
                    if (error.message.includes('プロジェクト名')) {
                        repairedProject.metadata.name = 'Untitled Project';
                    }
                    break;
                
                case 'workflow':
                    if (error.message.includes('ワークフローID')) {
                        const workflow = repairedProject.workflows.find(w => w.id === error.location?.workflowId);
                        if (workflow) {
                            workflow.id = `workflow-${Date.now()}`;
                        }
                    }
                    break;
            }
        });

        return repairedProject;
    }

    /**
     * バージョンの互換性チェック
     */
    private static isCompatibleVersion(version: string): boolean {
        const major = parseInt(version.split('.')[0]);
        const currentMajor = parseInt(this.FORMAT_VERSION.split('.')[0]);
        return major === currentMajor;
    }

    /**
     * JSON.stringify用のdate replacer
     */
    private static dateReplacer(key: string, value: any): any {
        if (value instanceof Date) {
            return { __type: 'Date', __value: value.toISOString() };
        }
        return value;
    }

    /**
     * JSON.parse用のdate reviver
     */
    private static dateReviver(key: string, value: any): any {
        if (value && typeof value === 'object' && value.__type === 'Date') {
            return new Date(value.__value);
        }
        return value;
    }

    /**
     * デフォルトプロジェクトの作成
     */
    static createDefaultProject(name: string): NodeCanvasProject {
        const now = new Date();
        
        const defaultCanvasSettings: CanvasSettings = {
            gridEnabled: true,
            gridSize: 20,
            snapToGrid: false,
            zoomLevel: 1,
            viewportPosition: { x: 0, y: 0 }
        };

        const metadata: ProjectMetadata = {
            name,
            description: '',
            createdAt: now,
            updatedAt: now,
            version: this.FORMAT_VERSION,
            tags: []
        };

        const defaultWorkflow: WorkflowDefinition = {
            id: `workflow-${Date.now()}`,
            name: 'メインワークフロー',
            description: '',
            nodes: [],
            edges: [],
            canvasSettings: defaultCanvasSettings,
            fileReferences: [],
            createdAt: now,
            updatedAt: now
        };

        return {
            metadata,
            workflows: [defaultWorkflow],
            activeWorkflowId: defaultWorkflow.id,
            projectSettings: {
                defaultCanvasSettings,
                theme: 'auto'
            },
            templates: []
        };
    }
}