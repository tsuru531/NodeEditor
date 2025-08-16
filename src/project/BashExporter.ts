/**
 * ノードグラフからBashスクリプトへのエクスポート機能
 */

import { Node, Edge } from 'reactflow';

/**
 * エクスポートオプション
 */
export interface ExportOptions {
    /** シバンラインを含めるか */
    includeShebang?: boolean;
    /** ヘッダーコメントを含めるか */
    includeHeader?: boolean;
    /** 関数コメントを含めるか */
    includeFunctionComments?: boolean;
    /** エラーハンドリングを含めるか */
    includeErrorHandling?: boolean;
    /** デバッグ出力を含めるか */
    includeDebugOutput?: boolean;
    /** 実行順序のコメントを含めるか */
    includeExecutionOrder?: boolean;
    /** 変数初期化を含めるか */
    includeVariableInit?: boolean;
    /** 出力形式 */
    outputFormat?: 'script' | 'function-library' | 'module';
}

/**
 * エクスポート結果
 */
export interface ExportResult {
    /** 生成されたスクリプト */
    script: string;
    /** 実行順序 */
    executionOrder: string[];
    /** 警告メッセージ */
    warnings: string[];
    /** エラーメッセージ */
    errors: string[];
    /** 使用された変数 */
    variables: string[];
    /** 使用された関数 */
    functions: string[];
}

/**
 * ノード実行情報
 */
interface NodeExecutionInfo {
    id: string;
    type: string;
    order: number;
    dependencies: string[];
    code: string;
    variables: string[];
}

/**
 * Bashエクスポータークラス
 */
export class BashExporter {
    /**
     * ノードグラフからBashスクリプトを生成
     */
    static async exportToScript(
        nodes: Node[], 
        edges: Edge[], 
        options: ExportOptions = {}
    ): Promise<ExportResult> {
        
        const {
            includeShebang = true,
            includeHeader = true,
            includeFunctionComments = true,
            includeErrorHandling = true,
            includeDebugOutput = false,
            includeExecutionOrder = true,
            includeVariableInit = true,
            outputFormat = 'script'
        } = options;

        const result: ExportResult = {
            script: '',
            executionOrder: [],
            warnings: [],
            errors: [],
            variables: [],
            functions: []
        };

        try {
            // ノードの実行順序を決定
            const executionInfo = this.analyzeExecutionOrder(nodes, edges);
            result.executionOrder = executionInfo.map(info => info.id);

            // スクリプトの各部分を生成
            const scriptParts: string[] = [];

            // シバン行
            if (includeShebang) {
                scriptParts.push('#!/bin/bash');
                scriptParts.push('');
            }

            // ヘッダーコメント
            if (includeHeader) {
                scriptParts.push(...this.generateHeader());
                scriptParts.push('');
            }

            // エラーハンドリング設定
            if (includeErrorHandling) {
                scriptParts.push(...this.generateErrorHandling());
                scriptParts.push('');
            }

            // 変数初期化
            if (includeVariableInit) {
                const variables = this.extractVariables(nodes);
                if (variables.length > 0) {
                    scriptParts.push('# 変数初期化');
                    scriptParts.push(...variables);
                    scriptParts.push('');
                }
                result.variables = variables;
            }

            // 出力形式に応じてスクリプトを生成
            switch (outputFormat) {
                case 'function-library':
                    scriptParts.push(...this.generateFunctionLibrary(executionInfo, includeFunctionComments));
                    break;
                case 'module':
                    scriptParts.push(...this.generateModule(executionInfo, includeFunctionComments));
                    break;
                default:
                    scriptParts.push(...this.generateMainScript(executionInfo, {
                        includeFunctionComments,
                        includeDebugOutput,
                        includeExecutionOrder
                    }));
                    break;
            }

            result.script = scriptParts.join('\n');
            result.functions = executionInfo
                .filter(info => info.type === 'functionNode')
                .map(info => this.extractFunctionName(info.code));

        } catch (error) {
            result.errors.push(`エクスポート中にエラーが発生しました: ${error}`);
        }

        return result;
    }

    /**
     * 実行順序を解析
     */
    private static analyzeExecutionOrder(nodes: Node[], edges: Edge[]): NodeExecutionInfo[] {
        const nodeMap = new Map<string, Node>();
        const executionInfo: NodeExecutionInfo[] = [];
        
        // ノードマップを作成
        nodes.forEach(node => nodeMap.set(node.id, node));

        // 依存関係グラフを構築
        const dependencies = new Map<string, string[]>();
        edges.forEach(edge => {
            if (!dependencies.has(edge.target)) {
                dependencies.set(edge.target, []);
            }
            dependencies.get(edge.target)!.push(edge.source);
        });

        // トポロジカルソートで実行順序を決定
        const visited = new Set<string>();
        const visiting = new Set<string>();
        const order: string[] = [];

        const visit = (nodeId: string) => {
            if (visiting.has(nodeId)) {
                throw new Error(`循環依存が検出されました: ${nodeId}`);
            }
            if (visited.has(nodeId)) {
                return;
            }

            visiting.add(nodeId);
            const deps = dependencies.get(nodeId) || [];
            deps.forEach(dep => visit(dep));
            visiting.delete(nodeId);
            visited.add(nodeId);
            order.push(nodeId);
        };

        // 全ノードを処理
        nodes.forEach(node => {
            if (!visited.has(node.id)) {
                visit(node.id);
            }
        });

        // 実行情報を作成
        order.forEach((nodeId, index) => {
            const node = nodeMap.get(nodeId);
            if (node) {
                executionInfo.push({
                    id: nodeId,
                    type: node.type || 'unknown',
                    order: index,
                    dependencies: dependencies.get(nodeId) || [],
                    code: this.extractNodeCode(node),
                    variables: this.extractNodeVariables(node)
                });
            }
        });

        return executionInfo;
    }

    /**
     * ヘッダーコメントを生成
     */
    private static generateHeader(): string[] {
        const now = new Date();
        return [
            '#',
            '# NodeCanvasで生成されたBashスクリプト',
            `# 生成日時: ${now.toLocaleString()}`,
            '#',
            '# このスクリプトは自動生成されました。',
            '# 手動で編集する場合は注意してください。',
            '#'
        ];
    }

    /**
     * エラーハンドリング設定を生成
     */
    private static generateErrorHandling(): string[] {
        return [
            '# エラーハンドリング設定',
            'set -euo pipefail  # エラー時に停止、未定義変数でエラー、パイプラインエラーを検出',
            '',
            '# エラートラップ',
            'error_exit() {',
            '    echo "エラーが発生しました。行: $1, 終了コード: $2" >&2',
            '    exit $2',
            '}',
            'trap \'error_exit ${LINENO} $?\' ERR'
        ];
    }

    /**
     * 変数を抽出
     */
    private static extractVariables(nodes: Node[]): string[] {
        const variables: string[] = [];
        
        nodes.forEach(node => {
            if (node.type === 'memoNode' && node.data?.nodeType === 'variable') {
                const name = node.data.variableName;
                const value = node.data.variableValue || '';
                const type = node.data.variableType;
                
                if (name) {
                    if (type === 'export') {
                        variables.push(`export ${name}="${value}"`);
                    } else {
                        variables.push(`${name}="${value}"`);
                    }
                }
            }
        });

        return variables;
    }

    /**
     * メインスクリプトを生成
     */
    private static generateMainScript(
        executionInfo: NodeExecutionInfo[], 
        options: {
            includeFunctionComments: boolean;
            includeDebugOutput: boolean;
            includeExecutionOrder: boolean;
        }
    ): string[] {
        const script: string[] = [];
        
        if (options.includeExecutionOrder) {
            script.push('# 実行順序:');
            executionInfo.forEach((info, index) => {
                script.push(`# ${index + 1}. ${info.id} (${info.type})`);
            });
            script.push('');
        }

        // 関数定義を先に出力
        const functions = executionInfo.filter(info => info.type === 'functionNode');
        if (functions.length > 0) {
            script.push('# 関数定義');
            functions.forEach(func => {
                if (options.includeFunctionComments) {
                    script.push(`# 関数: ${func.id}`);
                    if (func.dependencies.length > 0) {
                        script.push(`# 依存: ${func.dependencies.join(', ')}`);
                    }
                }
                script.push(this.formatFunctionCode(func.code));
                script.push('');
            });
        }

        // メイン実行部分
        const mainNodes = executionInfo.filter(info => info.type !== 'functionNode' && info.type !== 'memoNode');
        if (mainNodes.length > 0) {
            script.push('# メイン実行');
            mainNodes.forEach(node => {
                if (options.includeDebugOutput) {
                    script.push(`echo "実行中: ${node.id}" >&2`);
                }
                
                script.push(this.formatNodeCode(node));
                script.push('');
            });
        }

        // 関数実行
        if (functions.length > 0) {
            script.push('# 関数実行');
            functions.forEach(func => {
                const functionName = this.extractFunctionName(func.code);
                if (functionName) {
                    if (options.includeDebugOutput) {
                        script.push(`echo "関数実行: ${functionName}" >&2`);
                    }
                    script.push(`${functionName}`);
                }
            });
        }

        return script;
    }

    /**
     * 関数ライブラリを生成
     */
    private static generateFunctionLibrary(
        executionInfo: NodeExecutionInfo[], 
        includeFunctionComments: boolean
    ): string[] {
        const script: string[] = [];
        
        script.push('# NodeCanvas関数ライブラリ');
        script.push('# このファイルは他のスクリプトから source コマンドで読み込んで使用してください');
        script.push('');

        const functions = executionInfo.filter(info => info.type === 'functionNode');
        
        functions.forEach(func => {
            if (includeFunctionComments) {
                script.push(`# 関数: ${func.id}`);
                if (func.dependencies.length > 0) {
                    script.push(`# 依存: ${func.dependencies.join(', ')}`);
                }
                script.push('#');
            }
            
            script.push(this.formatFunctionCode(func.code));
            script.push('');
        });

        return script;
    }

    /**
     * モジュールを生成
     */
    private static generateModule(
        executionInfo: NodeExecutionInfo[], 
        includeFunctionComments: boolean
    ): string[] {
        const script: string[] = [];
        
        script.push('# NodeCanvasモジュール');
        script.push('');

        // モジュール初期化
        script.push('# モジュール初期化');
        script.push('readonly NODECANVAS_MODULE_LOADED=1');
        script.push('');

        // エクスポート関数一覧
        const functions = executionInfo.filter(info => info.type === 'functionNode');
        const functionNames = functions.map(func => this.extractFunctionName(func.code)).filter(Boolean);
        
        if (functionNames.length > 0) {
            script.push('# エクスポート関数一覧');
            script.push(`readonly NODECANVAS_FUNCTIONS=(${functionNames.join(' ')})`);
            script.push('');
        }

        // 関数定義
        functions.forEach(func => {
            if (includeFunctionComments) {
                script.push(`# 関数: ${func.id}`);
                if (func.dependencies.length > 0) {
                    script.push(`# 依存: ${func.dependencies.join(', ')}`);
                }
                script.push('#');
            }
            
            script.push(this.formatFunctionCode(func.code));
            script.push('');
        });

        // モジュールヘルプ関数
        script.push('# モジュールヘルプ');
        script.push('nodecanvas_help() {');
        script.push('    echo "NodeCanvasモジュール - 利用可能な関数:"');
        script.push('    printf " - %s\\n" "${NODECANVAS_FUNCTIONS[@]}"');
        script.push('}');

        return script;
    }

    /**
     * ノードからコードを抽出
     */
    private static extractNodeCode(node: Node): string {
        if (node.data?.code) {
            return node.data.code;
        }
        if (node.data?.content && node.type === 'memoNode') {
            return `# ${node.data.content}`;
        }
        return `# ノード: ${node.id}`;
    }

    /**
     * ノードから変数を抽出
     */
    private static extractNodeVariables(node: Node): string[] {
        const variables: string[] = [];
        const code = this.extractNodeCode(node);
        
        // 簡単な変数抽出（$variableまたは${variable}）
        const matches = code.match(/\$\{?(\w+)\}?/g);
        if (matches) {
            matches.forEach(match => {
                const variable = match.replace(/\$\{?(\w+)\}?/, '$1');
                if (!variables.includes(variable)) {
                    variables.push(variable);
                }
            });
        }

        return variables;
    }

    /**
     * 関数名を抽出
     */
    private static extractFunctionName(code: string): string {
        const match = code.match(/^function\s+(\w+)\s*\(\)|^(\w+)\s*\(\)\s*\{/m);
        return match ? (match[1] || match[2]) : '';
    }

    /**
     * 関数コードをフォーマット
     */
    private static formatFunctionCode(code: string): string {
        // コードが既に適切にフォーマットされている場合はそのまま返す
        if (code.includes('function ') || code.match(/^\w+\s*\(\)\s*\{/)) {
            return code;
        }

        // 簡単な関数として包む
        return `# 自動生成された関数\nauto_function() {\n    ${code.split('\n').join('\n    ')}\n}`;
    }

    /**
     * ノードコードをフォーマット
     */
    private static formatNodeCode(node: NodeExecutionInfo): string {
        let code = node.code;
        
        // コメントノードの場合
        if (node.type === 'memoNode') {
            return `# ${code.replace(/^# /, '')}`;
        }

        // コードにコメントを追加
        if (node.id) {
            code = `# ノード: ${node.id}\n${code}`;
        }

        return code;
    }

    /**
     * 高度なエクスポート（カスタムテンプレート使用）
     */
    static async exportWithTemplate(
        nodes: Node[], 
        edges: Edge[], 
        templatePath: string,
        options: ExportOptions = {}
    ): Promise<ExportResult> {
        // テンプレート機能は将来実装
        console.log('テンプレート機能は将来実装予定');
        return this.exportToScript(nodes, edges, options);
    }

    /**
     * エクスポート前の検証
     */
    static validateForExport(nodes: Node[], edges: Edge[]): { valid: boolean; errors: string[]; warnings: string[] } {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 循環依存チェック
        try {
            this.analyzeExecutionOrder(nodes, edges);
        } catch (error) {
            errors.push(`実行順序エラー: ${error}`);
        }

        // 空のノードチェック
        const emptyNodes = nodes.filter(node => !this.extractNodeCode(node) || this.extractNodeCode(node).trim() === '');
        if (emptyNodes.length > 0) {
            warnings.push(`空のノードが ${emptyNodes.length} 個あります`);
        }

        // 孤立ノードチェック
        const connectedNodes = new Set([...edges.map(e => e.source), ...edges.map(e => e.target)]);
        const isolatedNodes = nodes.filter(node => !connectedNodes.has(node.id));
        if (isolatedNodes.length > 0) {
            warnings.push(`孤立したノードが ${isolatedNodes.length} 個あります`);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
}