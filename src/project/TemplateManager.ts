/**
 * NodeCanvasテンプレート管理機能
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Node, Edge } from 'reactflow';
import { ProjectSerializer } from './ProjectSerializer';
import { NodeCanvasProject, WorkflowDefinition } from './types';

/**
 * テンプレート定義
 */
export interface Template {
    /** テンプレートID */
    id: string;
    /** テンプレート名 */
    name: string;
    /** 説明 */
    description: string;
    /** カテゴリ */
    category: string;
    /** 作成者 */
    author?: string;
    /** バージョン */
    version: string;
    /** タグ */
    tags: string[];
    /** アイコン */
    icon?: string;
    /** プレビュー画像 */
    preview?: string;
    /** ノード配列 */
    nodes: Node[];
    /** エッジ配列 */
    edges: Edge[];
    /** 使用言語 */
    languages?: string[];
    /** 必要な依存関係 */
    dependencies?: string[];
    /** 設定可能なパラメータ */
    parameters?: TemplateParameter[];
    /** 作成日時 */
    createdAt: Date;
    /** 更新日時 */
    updatedAt: Date;
}

/**
 * テンプレートパラメータ
 */
export interface TemplateParameter {
    /** パラメータ名 */
    name: string;
    /** 表示名 */
    displayName: string;
    /** 説明 */
    description: string;
    /** タイプ */
    type: 'string' | 'number' | 'boolean' | 'select' | 'file' | 'directory';
    /** デフォルト値 */
    defaultValue?: any;
    /** 必須かどうか */
    required: boolean;
    /** 選択肢（selectタイプの場合） */
    options?: string[];
    /** 検証パターン */
    validation?: string;
}

/**
 * テンプレートカテゴリ
 */
export interface TemplateCategory {
    id: string;
    name: string;
    description: string;
    icon?: string;
    color?: string;
}

/**
 * テンプレート適用結果
 */
export interface TemplateApplicationResult {
    /** 生成されたノード */
    nodes: Node[];
    /** 生成されたエッジ */
    edges: Edge[];
    /** 適用されたパラメータ */
    appliedParameters: Record<string, any>;
    /** 警告メッセージ */
    warnings: string[];
    /** エラーメッセージ */
    errors: string[];
}

/**
 * テンプレート管理クラス
 */
export class TemplateManager {
    private static instance: TemplateManager;
    private templates = new Map<string, Template>();
    private categories = new Map<string, TemplateCategory>();
    private templatesPath: string;

    private constructor() {
        // テンプレートディレクトリのパス
        this.templatesPath = path.join(__dirname, '..', '..', 'templates');
        this.initializeBuiltinCategories();
    }

    /**
     * シングルトンインスタンスの取得
     */
    static getInstance(): TemplateManager {
        if (!TemplateManager.instance) {
            TemplateManager.instance = new TemplateManager();
        }
        return TemplateManager.instance;
    }

    /**
     * 初期化
     */
    async initialize(): Promise<void> {
        try {
            await this.ensureTemplatesDirectory();
            await this.loadBuiltinTemplates();
            await this.loadUserTemplates();
        } catch (error) {
            console.error('テンプレート管理の初期化に失敗:', error);
        }
    }

    /**
     * すべてのテンプレートを取得
     */
    getTemplates(): Template[] {
        return Array.from(this.templates.values());
    }

    /**
     * カテゴリ別のテンプレートを取得
     */
    getTemplatesByCategory(categoryId: string): Template[] {
        return this.getTemplates().filter(template => template.category === categoryId);
    }

    /**
     * テンプレートをIDで取得
     */
    getTemplate(id: string): Template | undefined {
        return this.templates.get(id);
    }

    /**
     * すべてのカテゴリを取得
     */
    getCategories(): TemplateCategory[] {
        return Array.from(this.categories.values());
    }

    /**
     * テンプレートを検索
     */
    searchTemplates(query: string, category?: string): Template[] {
        const templates = category 
            ? this.getTemplatesByCategory(category)
            : this.getTemplates();
        
        const lowerQuery = query.toLowerCase();
        
        return templates.filter(template => 
            template.name.toLowerCase().includes(lowerQuery) ||
            template.description.toLowerCase().includes(lowerQuery) ||
            template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    }

    /**
     * テンプレートを適用
     */
    async applyTemplate(
        templateId: string, 
        parameters: Record<string, any> = {},
        position: { x: number; y: number } = { x: 0, y: 0 }
    ): Promise<TemplateApplicationResult> {
        
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`テンプレートが見つかりません: ${templateId}`);
        }

        const result: TemplateApplicationResult = {
            nodes: [],
            edges: [],
            appliedParameters: parameters,
            warnings: [],
            errors: []
        };

        try {
            // パラメータの検証
            const validationResult = this.validateParameters(template, parameters);
            result.warnings.push(...validationResult.warnings);
            result.errors.push(...validationResult.errors);

            if (result.errors.length > 0) {
                return result;
            }

            // ノードとエッジのコピー＆パラメータ適用
            result.nodes = await this.processTemplateNodes(template.nodes, parameters, position);
            result.edges = this.processTemplateEdges(template.edges, result.nodes);

        } catch (error) {
            result.errors.push(`テンプレート適用エラー: ${error}`);
        }

        return result;
    }

    /**
     * 現在の選択からテンプレートを作成
     */
    async createTemplateFromSelection(
        nodes: Node[],
        edges: Edge[],
        templateInfo: {
            name: string;
            description: string;
            category: string;
            tags?: string[];
            parameters?: TemplateParameter[];
        }
    ): Promise<Template> {
        
        const template: Template = {
            id: this.generateTemplateId(),
            name: templateInfo.name,
            description: templateInfo.description,
            category: templateInfo.category,
            version: '1.0.0',
            tags: templateInfo.tags || [],
            nodes: this.normalizeNodes(nodes),
            edges: this.normalizeEdges(edges),
            parameters: templateInfo.parameters || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // テンプレートを保存
        await this.saveTemplate(template);
        this.templates.set(template.id, template);

        return template;
    }

    /**
     * テンプレートを保存
     */
    async saveTemplate(template: Template): Promise<void> {
        const templatePath = path.join(this.templatesPath, 'user', `${template.id}.json`);
        
        await fs.mkdir(path.dirname(templatePath), { recursive: true });
        await fs.writeFile(templatePath, JSON.stringify(template, null, 2), 'utf8');
    }

    /**
     * テンプレートを削除
     */
    async deleteTemplate(templateId: string): Promise<void> {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`テンプレートが見つかりません: ${templateId}`);
        }

        const templatePath = path.join(this.templatesPath, 'user', `${templateId}.json`);
        
        try {
            await fs.unlink(templatePath);
            this.templates.delete(templateId);
        } catch (error) {
            throw new Error(`テンプレート削除に失敗: ${error}`);
        }
    }

    /**
     * テンプレートをエクスポート
     */
    async exportTemplate(templateId: string, outputPath: string): Promise<void> {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`テンプレートが見つかりません: ${templateId}`);
        }

        await fs.writeFile(outputPath, JSON.stringify(template, null, 2), 'utf8');
    }

    /**
     * テンプレートをインポート
     */
    async importTemplate(templatePath: string): Promise<Template> {
        try {
            const content = await fs.readFile(templatePath, 'utf8');
            const template: Template = JSON.parse(content);
            
            // バリデーション
            this.validateTemplateStructure(template);
            
            // 新しいIDを生成（重複を避けるため）
            template.id = this.generateTemplateId();
            template.updatedAt = new Date();
            
            await this.saveTemplate(template);
            this.templates.set(template.id, template);
            
            return template;
            
        } catch (error) {
            throw new Error(`テンプレートインポートエラー: ${error}`);
        }
    }

    /**
     * 組み込みカテゴリの初期化
     */
    private initializeBuiltinCategories(): void {
        const builtinCategories: TemplateCategory[] = [
            {
                id: 'basic',
                name: '基本',
                description: '基本的なワークフロー',
                icon: '📋',
                color: '#3498db'
            },
            {
                id: 'bash',
                name: 'Bash',
                description: 'Bashスクリプト関連',
                icon: '📜',
                color: '#2ecc71'
            },
            {
                id: 'automation',
                name: '自動化',
                description: '作業自動化のテンプレート',
                icon: '⚙️',
                color: '#f39c12'
            },
            {
                id: 'data-processing',
                name: 'データ処理',
                description: 'データ処理と変換',
                icon: '📊',
                color: '#9b59b6'
            },
            {
                id: 'devops',
                name: 'DevOps',
                description: '開発・運用関連',
                icon: '🔧',
                color: '#e74c3c'
            }
        ];

        builtinCategories.forEach(category => {
            this.categories.set(category.id, category);
        });
    }

    /**
     * テンプレートディレクトリの確保
     */
    private async ensureTemplatesDirectory(): Promise<void> {
        const directories = [
            this.templatesPath,
            path.join(this.templatesPath, 'builtin'),
            path.join(this.templatesPath, 'user')
        ];

        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    /**
     * 組み込みテンプレートの読み込み
     */
    private async loadBuiltinTemplates(): Promise<void> {
        await this.createBuiltinTemplates();
    }

    /**
     * ユーザーテンプレートの読み込み
     */
    private async loadUserTemplates(): Promise<void> {
        try {
            const userTemplatesDir = path.join(this.templatesPath, 'user');
            const files = await fs.readdir(userTemplatesDir);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = path.join(userTemplatesDir, file);
                        const content = await fs.readFile(filePath, 'utf8');
                        const template: Template = JSON.parse(content);
                        this.templates.set(template.id, template);
                    } catch (error) {
                        console.warn(`テンプレート読み込みエラー: ${file}`, error);
                    }
                }
            }
        } catch (error) {
            console.warn('ユーザーテンプレートディレクトリが見つかりません');
        }
    }

    /**
     * 組み込みテンプレートの作成
     */
    private async createBuiltinTemplates(): Promise<void> {
        const templates: Template[] = [
            {
                id: 'hello-world',
                name: 'Hello World',
                description: 'シンプルなHello Worldワークフロー',
                category: 'basic',
                version: '1.0.0',
                tags: ['入門', 'サンプル'],
                icon: '👋',
                nodes: [
                    {
                        id: 'hello-node',
                        type: 'functionNode',
                        position: { x: 100, y: 100 },
                        data: {
                            functionName: 'hello_world',
                            code: 'echo "Hello, NodeCanvas!"',
                            language: 'bash',
                            isRunnable: true
                        }
                    }
                ],
                edges: [],
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'file-processing',
                name: 'ファイル処理',
                description: 'ファイルの読み取り、処理、出力のワークフロー',
                category: 'data-processing',
                version: '1.0.0',
                tags: ['ファイル', '処理'],
                icon: '📁',
                nodes: [
                    {
                        id: 'input-file',
                        type: 'fileNode',
                        position: { x: 50, y: 100 },
                        data: {
                            filePath: '{{inputFile}}',
                            fileName: 'input.txt'
                        }
                    },
                    {
                        id: 'process-file',
                        type: 'functionNode',
                        position: { x: 300, y: 100 },
                        data: {
                            functionName: 'process_file',
                            code: 'cat "$1" | sort | uniq > "$2"',
                            parameters: ['inputFile', 'outputFile'],
                            language: 'bash'
                        }
                    },
                    {
                        id: 'output-file',
                        type: 'fileNode',
                        position: { x: 550, y: 100 },
                        data: {
                            filePath: '{{outputFile}}',
                            fileName: 'output.txt'
                        }
                    }
                ],
                edges: [
                    {
                        id: 'edge-1',
                        source: 'input-file',
                        target: 'process-file',
                        type: 'smoothstep'
                    },
                    {
                        id: 'edge-2',
                        source: 'process-file',
                        target: 'output-file',
                        type: 'smoothstep'
                    }
                ],
                parameters: [
                    {
                        name: 'inputFile',
                        displayName: '入力ファイル',
                        description: '処理する入力ファイルのパス',
                        type: 'file',
                        required: true
                    },
                    {
                        name: 'outputFile',
                        displayName: '出力ファイル',
                        description: '結果を保存するファイルのパス',
                        type: 'file',
                        required: true,
                        defaultValue: 'output.txt'
                    }
                ],
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        templates.forEach(template => {
            this.templates.set(template.id, template);
        });
    }

    /**
     * パラメータの検証
     */
    private validateParameters(
        template: Template, 
        parameters: Record<string, any>
    ): { warnings: string[]; errors: string[] } {
        
        const warnings: string[] = [];
        const errors: string[] = [];

        template.parameters?.forEach(param => {
            const value = parameters[param.name];
            
            if (param.required && (value === undefined || value === null || value === '')) {
                errors.push(`必須パラメータが設定されていません: ${param.displayName}`);
                return;
            }

            if (value !== undefined && param.validation) {
                const regex = new RegExp(param.validation);
                if (!regex.test(String(value))) {
                    errors.push(`パラメータの形式が正しくありません: ${param.displayName}`);
                }
            }
        });

        return { warnings, errors };
    }

    /**
     * テンプレートノードの処理
     */
    private async processTemplateNodes(
        templateNodes: Node[], 
        parameters: Record<string, any>,
        position: { x: number; y: number }
    ): Promise<Node[]> {
        
        return templateNodes.map(node => {
            const newNode = { ...node };
            newNode.id = this.generateNodeId();
            
            // 位置の調整
            newNode.position = {
                x: node.position.x + position.x,
                y: node.position.y + position.y
            };
            
            // パラメータの置換
            newNode.data = this.replaceParameters(node.data, parameters);
            
            return newNode;
        });
    }

    /**
     * テンプレートエッジの処理
     */
    private processTemplateEdges(templateEdges: Edge[], newNodes: Node[]): Edge[] {
        const nodeIdMap = new Map<string, string>();
        
        // 元のノードIDと新しいノードIDのマッピングを作成
        templateEdges.forEach((edge, index) => {
            if (!nodeIdMap.has(edge.source)) {
                nodeIdMap.set(edge.source, newNodes[index]?.id || this.generateNodeId());
            }
            if (!nodeIdMap.has(edge.target)) {
                const sourceNode = newNodes.find(n2 => nodeIdMap.get(edge.source) === n2.id);
                const sourceX = sourceNode?.position.x || 0;
                const targetNode = newNodes.find(n => n.position.x > sourceX);
                nodeIdMap.set(edge.target, targetNode?.id || this.generateNodeId());
            }
        });

        return templateEdges.map(edge => ({
            ...edge,
            id: this.generateEdgeId(),
            source: nodeIdMap.get(edge.source) || edge.source,
            target: nodeIdMap.get(edge.target) || edge.target
        }));
    }

    /**
     * パラメータの置換
     */
    private replaceParameters(data: any, parameters: Record<string, any>): any {
        if (typeof data === 'string') {
            return data.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                return parameters[key] !== undefined ? String(parameters[key]) : match;
            });
        }
        
        if (Array.isArray(data)) {
            return data.map(item => this.replaceParameters(item, parameters));
        }
        
        if (typeof data === 'object' && data !== null) {
            const result: any = {};
            for (const [key, value] of Object.entries(data)) {
                result[key] = this.replaceParameters(value, parameters);
            }
            return result;
        }
        
        return data;
    }

    /**
     * ノードの正規化
     */
    private normalizeNodes(nodes: Node[]): Node[] {
        return nodes.map((node, index) => ({
            ...node,
            id: `node-${index}`,
            position: {
                x: node.position.x - Math.min(...nodes.map(n => n.position.x)),
                y: node.position.y - Math.min(...nodes.map(n => n.position.y))
            }
        }));
    }

    /**
     * エッジの正規化
     */
    private normalizeEdges(edges: Edge[]): Edge[] {
        return edges.map((edge, index) => ({
            ...edge,
            id: `edge-${index}`
        }));
    }

    /**
     * テンプレート構造の検証
     */
    private validateTemplateStructure(template: any): void {
        const requiredFields = ['id', 'name', 'description', 'category', 'version', 'nodes', 'edges'];
        
        for (const field of requiredFields) {
            if (!(field in template)) {
                throw new Error(`必須フィールドが不足しています: ${field}`);
            }
        }
    }

    /**
     * テンプレートIDの生成
     */
    private generateTemplateId(): string {
        return `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * ノードIDの生成
     */
    private generateNodeId(): string {
        return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * エッジIDの生成
     */
    private generateEdgeId(): string {
        return `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}