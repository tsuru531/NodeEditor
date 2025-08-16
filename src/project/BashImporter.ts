/**
 * Bashスクリプトからノードグラフへのインポート機能
 */

import { Node, Edge } from 'reactflow';

/**
 * Bash関数の情報
 */
export interface BashFunction {
    name: string;
    parameters: string[];
    body: string;
    description?: string;
    dependencies?: string[];
    returns?: string;
    lineNumber: number;
}

/**
 * Bash変数の情報
 */
export interface BashVariable {
    name: string;
    value: string;
    type: 'string' | 'number' | 'array' | 'export';
    lineNumber: number;
    scope: 'global' | 'local';
}

/**
 * Bashコマンドの情報
 */
export interface BashCommand {
    command: string;
    arguments: string[];
    pipes?: BashCommand[];
    conditions?: string;
    lineNumber: number;
    type: 'simple' | 'pipe' | 'conditional' | 'loop';
}

/**
 * インポート結果
 */
export interface ImportResult {
    nodes: Node[];
    edges: Edge[];
    functions: BashFunction[];
    variables: BashVariable[];
    commands: BashCommand[];
    warnings: string[];
    errors: string[];
}

/**
 * Bashインポータークラス
 */
export class BashImporter {
    private static readonly FUNCTION_PATTERN = /^function\s+(\w+)\s*\(\)\s*\{|^(\w+)\s*\(\)\s*\{/gm;
    private static readonly VARIABLE_PATTERN = /^(export\s+)?(\w+)=([^#\n]*)/gm;
    private static readonly COMMENT_PATTERN = /^\s*#\s*(.+)$/gm;

    /**
     * Bashスクリプトからノードグラフをインポート
     */
    static async importFromScript(scriptContent: string, options: {
        createFunctionNodes?: boolean;
        createVariableNodes?: boolean;
        createCommandNodes?: boolean;
        preserveComments?: boolean;
        groupByFunction?: boolean;
    } = {}): Promise<ImportResult> {
        
        const {
            createFunctionNodes = true,
            createVariableNodes = true,
            createCommandNodes = true,
            preserveComments = true,
            groupByFunction = false
        } = options;

        const result: ImportResult = {
            nodes: [],
            edges: [],
            functions: [],
            variables: [],
            commands: [],
            warnings: [],
            errors: []
        };

        try {
            // スクリプトを行に分割
            const lines = scriptContent.split('\n');
            
            // 関数の解析
            if (createFunctionNodes) {
                result.functions = this.parseFunctions(scriptContent, lines);
                result.nodes.push(...this.createFunctionNodes(result.functions));
            }

            // 変数の解析
            if (createVariableNodes) {
                result.variables = this.parseVariables(scriptContent, lines);
                result.nodes.push(...this.createVariableNodes(result.variables));
            }

            // コマンドの解析
            if (createCommandNodes) {
                result.commands = this.parseCommands(scriptContent, lines);
                result.nodes.push(...this.createCommandNodes(result.commands));
            }

            // コメントの保持
            if (preserveComments) {
                const comments = this.parseComments(scriptContent, lines);
                result.nodes.push(...this.createCommentNodes(comments));
            }

            // エッジの生成（依存関係に基づく）
            result.edges = this.generateEdges(result.functions, result.variables, result.commands);

            // グループ化
            if (groupByFunction) {
                this.groupNodesByFunction(result);
            }

            // ノードの位置調整
            this.arrangeNodes(result.nodes);

        } catch (error) {
            result.errors.push(`インポート中にエラーが発生しました: ${error}`);
        }

        return result;
    }

    /**
     * 関数を解析
     */
    private static parseFunctions(content: string, lines: string[]): BashFunction[] {
        const functions: BashFunction[] = [];
        const functionMatches = [...content.matchAll(this.FUNCTION_PATTERN)];

        for (const match of functionMatches) {
            const functionName = match[1] || match[2];
            const lineNumber = this.getLineNumber(content, match.index!);
            
            try {
                const functionBody = this.extractFunctionBody(lines, lineNumber - 1);
                const parameters = this.extractParameters(functionBody);
                const description = this.extractDescription(lines, lineNumber - 1);
                const dependencies = this.extractDependencies(functionBody);

                functions.push({
                    name: functionName,
                    parameters,
                    body: functionBody,
                    description,
                    dependencies,
                    lineNumber
                });

            } catch (error) {
                console.warn(`関数 ${functionName} の解析に失敗:`, error);
            }
        }

        return functions;
    }

    /**
     * 変数を解析
     */
    private static parseVariables(content: string, lines: string[]): BashVariable[] {
        const variables: BashVariable[] = [];
        const variableMatches = [...content.matchAll(this.VARIABLE_PATTERN)];

        for (const match of variableMatches) {
            const isExport = !!match[1];
            const name = match[2];
            const value = match[3].trim();
            const lineNumber = this.getLineNumber(content, match.index!);

            variables.push({
                name,
                value,
                type: isExport ? 'export' : this.inferVariableType(value),
                lineNumber,
                scope: isExport ? 'global' : 'local'
            });
        }

        return variables;
    }

    /**
     * コマンドを解析
     */
    private static parseCommands(content: string, lines: string[]): BashCommand[] {
        const commands: BashCommand[] = [];
        
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            
            // コメントや空行をスキップ
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                return;
            }

            // 関数定義や変数代入をスキップ
            if (this.isFunctionDefinition(trimmedLine) || this.isVariableAssignment(trimmedLine)) {
                return;
            }

            try {
                const command = this.parseCommandLine(trimmedLine, index + 1);
                if (command) {
                    commands.push(command);
                }
            } catch (error) {
                console.warn(`コマンド解析エラー (行 ${index + 1}):`, error);
            }
        });

        return commands;
    }

    /**
     * コメントを解析
     */
    private static parseComments(content: string, lines: string[]): Array<{content: string, lineNumber: number}> {
        const comments: Array<{content: string, lineNumber: number}> = [];
        const commentMatches = [...content.matchAll(this.COMMENT_PATTERN)];

        for (const match of commentMatches) {
            const commentContent = match[1].trim();
            const lineNumber = this.getLineNumber(content, match.index!);
            
            comments.push({
                content: commentContent,
                lineNumber
            });
        }

        return comments;
    }

    /**
     * 関数ノードを作成
     */
    private static createFunctionNodes(functions: BashFunction[]): Node[] {
        return functions.map((func, index) => ({
            id: `function-${func.name}`,
            type: 'functionNode',
            position: { x: 300 + (index % 3) * 250, y: 100 + Math.floor(index / 3) * 200 },
            data: {
                functionName: func.name,
                parameters: func.parameters,
                code: func.body,
                description: func.description,
                language: 'bash',
                isRunnable: true,
                dependencies: func.dependencies
            }
        }));
    }

    /**
     * 変数ノードを作成
     */
    private static createVariableNodes(variables: BashVariable[]): Node[] {
        return variables.map((variable, index) => ({
            id: `variable-${variable.name}`,
            type: 'memoNode',
            position: { x: 50 + (index % 4) * 200, y: 50 + Math.floor(index / 4) * 150 },
            data: {
                content: `**${variable.name}**\n\n値: \`${variable.value}\`\nタイプ: ${variable.type}\nスコープ: ${variable.scope}`,
                title: `変数: ${variable.name}`,
                nodeType: 'variable',
                variableName: variable.name,
                variableValue: variable.value,
                variableType: variable.type
            }
        }));
    }

    /**
     * コマンドノードを作成
     */
    private static createCommandNodes(commands: BashCommand[]): Node[] {
        return commands.map((command, index) => ({
            id: `command-${index}`,
            type: 'functionNode',
            position: { x: 600 + (index % 3) * 250, y: 300 + Math.floor(index / 3) * 150 },
            data: {
                functionName: `Command ${index + 1}`,
                code: command.command + (command.arguments.length > 0 ? ' ' + command.arguments.join(' ') : ''),
                description: `コマンド実行: ${command.command}`,
                language: 'bash',
                isRunnable: true,
                commandType: command.type
            }
        }));
    }

    /**
     * コメントノードを作成
     */
    private static createCommentNodes(comments: Array<{content: string, lineNumber: number}>): Node[] {
        return comments.map((comment, index) => ({
            id: `comment-${index}`,
            type: 'memoNode',
            position: { x: 900 + (index % 2) * 200, y: 50 + Math.floor(index / 2) * 100 },
            data: {
                content: comment.content,
                title: `コメント (行 ${comment.lineNumber})`,
                nodeType: 'comment'
            }
        }));
    }

    /**
     * エッジを生成（依存関係に基づく）
     */
    private static generateEdges(functions: BashFunction[], variables: BashVariable[], commands: BashCommand[]): Edge[] {
        const edges: Edge[] = [];

        // 関数間の依存関係
        functions.forEach(func => {
            func.dependencies?.forEach(dep => {
                const depFunction = functions.find(f => f.name === dep);
                if (depFunction) {
                    edges.push({
                        id: `edge-${depFunction.name}-${func.name}`,
                        source: `function-${depFunction.name}`,
                        target: `function-${func.name}`,
                        type: 'smoothstep'
                    });
                }
            });
        });

        // 変数の使用関係
        variables.forEach(variable => {
            functions.forEach(func => {
                if (func.body.includes(`$${variable.name}`) || func.body.includes(`\${${variable.name}}`)) {
                    edges.push({
                        id: `edge-var-${variable.name}-${func.name}`,
                        source: `variable-${variable.name}`,
                        target: `function-${func.name}`,
                        type: 'step'
                    });
                }
            });
        });

        return edges;
    }

    /**
     * 関数によるグループ化
     */
    private static groupNodesByFunction(result: ImportResult): void {
        // 実装は将来的にReact Flowのグループ機能を使用
        console.log('グループ化機能は将来実装予定');
    }

    /**
     * ノードの位置を調整
     */
    private static arrangeNodes(nodes: Node[]): void {
        // 基本的なグリッド配置
        nodes.forEach((node, index) => {
            if (!node.position) {
                node.position = {
                    x: (index % 4) * 250 + 50,
                    y: Math.floor(index / 4) * 200 + 50
                };
            }
        });
    }

    /**
     * 関数本体を抽出
     */
    private static extractFunctionBody(lines: string[], startLine: number): string {
        let braceCount = 0;
        let bodyLines: string[] = [];
        let inFunction = false;

        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i];
            
            if (!inFunction && line.includes('{')) {
                inFunction = true;
                braceCount = 1;
                continue;
            }

            if (inFunction) {
                const openBraces = (line.match(/\{/g) || []).length;
                const closeBraces = (line.match(/\}/g) || []).length;
                
                braceCount += openBraces - closeBraces;
                
                if (braceCount === 0) {
                    break;
                }
                
                bodyLines.push(line);
            }
        }

        return bodyLines.join('\n');
    }

    /**
     * パラメータを抽出
     */
    private static extractParameters(functionBody: string): string[] {
        const parameters: string[] = [];
        const paramMatches = functionBody.match(/\$\{?(\d+)\}?/g);
        
        if (paramMatches) {
            const paramNumbers = paramMatches
                .map(match => parseInt(match.replace(/\$\{?(\d+)\}?/, '$1')))
                .filter(num => !isNaN(num))
                .sort((a, b) => a - b);
            
            for (let i = 1; i <= Math.max(...paramNumbers); i++) {
                parameters.push(`param${i}`);
            }
        }

        return parameters;
    }

    /**
     * 説明を抽出（関数の直前のコメント）
     */
    private static extractDescription(lines: string[], functionLine: number): string | undefined {
        for (let i = functionLine - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith('#')) {
                return line.substring(1).trim();
            }
            if (line !== '') {
                break;
            }
        }
        return undefined;
    }

    /**
     * 依存関係を抽出
     */
    private static extractDependencies(functionBody: string): string[] {
        const dependencies: string[] = [];
        const callMatches = functionBody.match(/(\w+)\s*(?:\(\))?(?:\s|$)/g);
        
        if (callMatches) {
            callMatches.forEach(match => {
                const funcName = match.trim().replace(/\(\)/, '');
                if (funcName && !dependencies.includes(funcName)) {
                    dependencies.push(funcName);
                }
            });
        }

        return dependencies;
    }

    /**
     * 変数タイプを推測
     */
    private static inferVariableType(value: string): 'string' | 'number' | 'array' {
        if (/^\d+$/.test(value)) {
            return 'number';
        }
        if (value.startsWith('(') && value.endsWith(')')) {
            return 'array';
        }
        return 'string';
    }

    /**
     * コマンドラインを解析
     */
    private static parseCommandLine(line: string, lineNumber: number): BashCommand | null {
        const trimmed = line.trim();
        
        if (trimmed.includes('|')) {
            return this.parsePipeCommand(trimmed, lineNumber);
        }
        
        if (trimmed.includes('if') || trimmed.includes('while') || trimmed.includes('for')) {
            return this.parseControlCommand(trimmed, lineNumber);
        }

        const parts = trimmed.split(/\s+/);
        if (parts.length === 0) {
            return null;
        }

        return {
            command: parts[0],
            arguments: parts.slice(1),
            lineNumber,
            type: 'simple'
        };
    }

    /**
     * パイプコマンドを解析
     */
    private static parsePipeCommand(line: string, lineNumber: number): BashCommand {
        const commands = line.split('|').map(cmd => cmd.trim());
        const mainCommand = commands[0].split(/\s+/);
        
        return {
            command: mainCommand[0],
            arguments: mainCommand.slice(1),
            pipes: commands.slice(1).map(cmd => {
                const parts = cmd.split(/\s+/);
                return {
                    command: parts[0],
                    arguments: parts.slice(1),
                    lineNumber,
                    type: 'simple' as const
                };
            }),
            lineNumber,
            type: 'pipe'
        };
    }

    /**
     * 制御構造コマンドを解析
     */
    private static parseControlCommand(line: string, lineNumber: number): BashCommand {
        const parts = line.split(/\s+/);
        
        return {
            command: parts[0],
            arguments: parts.slice(1),
            lineNumber,
            type: parts[0] === 'if' ? 'conditional' : 'loop'
        };
    }

    /**
     * 行番号を取得
     */
    private static getLineNumber(content: string, index: number): number {
        return content.substring(0, index).split('\n').length;
    }

    /**
     * 関数定義かチェック
     */
    private static isFunctionDefinition(line: string): boolean {
        return /^function\s+\w+\s*\(\)|^\w+\s*\(\)\s*\{/.test(line);
    }

    /**
     * 変数代入かチェック
     */
    private static isVariableAssignment(line: string): boolean {
        return /^(export\s+)?\w+=/.test(line);
    }
}