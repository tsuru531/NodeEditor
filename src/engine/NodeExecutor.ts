import { Node } from 'reactflow';
import { 
  NodeExecutionState, 
  ExecutionStatus,
  ExecutionContext,
  DataTransfer,
  ExecutionError
} from './types';

/**
 * ノード実行器の基底インターフェース
 */
export interface INodeExecutor {
  execute(node: Node, context: ExecutionContext, inputs: Map<string, any>): Promise<any>;
  validateInputs(node: Node, inputs: Map<string, any>): ExecutionError[];
  getRequiredInputs(node: Node): string[];
  getOutputs(node: Node): string[];
}

/**
 * メモノード実行器
 */
export class MemoNodeExecutor implements INodeExecutor {
  async execute(node: Node, context: ExecutionContext, inputs: Map<string, any>): Promise<any> {
    // メモノードは即座に完了
    const content = node.data?.content || '';
    return {
      type: 'memo',
      content,
      timestamp: Date.now()
    };
  }

  validateInputs(node: Node, inputs: Map<string, any>): ExecutionError[] {
    // メモノードは入力検証不要
    return [];
  }

  getRequiredInputs(node: Node): string[] {
    return [];
  }

  getOutputs(node: Node): string[] {
    return ['content'];
  }
}

/**
 * ファイルノード実行器
 */
export class FileNodeExecutor implements INodeExecutor {
  async execute(node: Node, context: ExecutionContext, inputs: Map<string, any>): Promise<any> {
    const filePath = node.data?.filePath;
    if (!filePath) {
      throw new Error('ファイルパスが指定されていません');
    }

    try {
      // ファイル読み込み（実際の実装ではfs使用）
      const content = await this.readFile(filePath);
      return {
        type: 'file',
        path: filePath,
        content,
        size: content.length,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`ファイル読み込みエラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  private async readFile(filePath: string): Promise<string> {
    // 実際の実装では fs.readFile を使用
    // ここでは仮の実装
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (filePath.includes('error')) {
          reject(new Error('ファイルが見つかりません'));
        } else {
          resolve(`ファイル内容: ${filePath}`);
        }
      }, 100);
    });
  }

  validateInputs(node: Node, inputs: Map<string, any>): ExecutionError[] {
    const errors: ExecutionError[] = [];
    const filePath = node.data?.filePath;
    
    if (!filePath) {
      errors.push({
        type: 'validation',
        nodeId: node.id,
        message: 'ファイルパスが必要です',
        timestamp: Date.now()
      });
    }
    
    return errors;
  }

  getRequiredInputs(node: Node): string[] {
    return [];
  }

  getOutputs(node: Node): string[] {
    return ['content', 'path', 'size'];
  }
}

/**
 * 関数ノード実行器
 */
export class FunctionNodeExecutor implements INodeExecutor {
  async execute(node: Node, context: ExecutionContext, inputs: Map<string, any>): Promise<any> {
    const functionCode = node.data?.code;
    const language = node.data?.language || 'bash';
    
    if (!functionCode) {
      throw new Error('関数コードが指定されていません');
    }

    try {
      const result = await this.executeFunction(functionCode, language, inputs, context);
      return {
        type: 'function',
        language,
        code: functionCode,
        result,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`関数実行エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  private async executeFunction(
    code: string, 
    language: string, 
    inputs: Map<string, any>,
    context: ExecutionContext
  ): Promise<any> {
    switch (language) {
      case 'bash':
        return this.executeBashFunction(code, inputs);
      case 'javascript':
        return this.executeJavaScriptFunction(code, inputs);
      default:
        throw new Error(`サポートされていない言語: ${language}`);
    }
  }

  private async executeBashFunction(code: string, inputs: Map<string, any>): Promise<any> {
    // 実際の実装では child_process を使用してbashを実行
    // ここでは仮の実装
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (code.includes('error')) {
          reject(new Error('Bash実行エラー'));
        } else {
          resolve({
            stdout: `Bash実行結果: ${code}`,
            stderr: '',
            exitCode: 0,
            inputs: Object.fromEntries(inputs)
          });
        }
      }, Math.random() * 2000 + 1000);
    });
  }

  private async executeJavaScriptFunction(code: string, inputs: Map<string, any>): Promise<any> {
    // 実際の実装では安全なJavaScript実行環境を使用
    // ここでは仮の実装
    try {
      const inputObj = Object.fromEntries(inputs);
      const func = new Function('inputs', `
        const { ${Object.keys(inputObj).join(', ')} } = inputs;
        ${code}
      `);
      
      const result = func(inputObj);
      return {
        result,
        inputs: inputObj
      };
    } catch (error) {
      throw new Error(`JavaScript実行エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  validateInputs(node: Node, inputs: Map<string, any>): ExecutionError[] {
    const errors: ExecutionError[] = [];
    const code = node.data?.code;
    
    if (!code) {
      errors.push({
        type: 'validation',
        nodeId: node.id,
        message: '関数コードが必要です',
        timestamp: Date.now()
      });
    }
    
    return errors;
  }

  getRequiredInputs(node: Node): string[] {
    // 関数コードから必要な入力を解析（簡易実装）
    const code = node.data?.code || '';
    const inputMatches = code.match(/\$\{(\w+)\}/g) || [];
    return inputMatches.map((match: string) => match.slice(2, -1));
  }

  getOutputs(node: Node): string[] {
    return ['result', 'stdout', 'stderr'];
  }
}

/**
 * コネクターノード実行器
 */
export class ConnectorNodeExecutor implements INodeExecutor {
  async execute(node: Node, context: ExecutionContext, inputs: Map<string, any>): Promise<any> {
    // コネクターノードは入力をそのまま出力に転送
    const inputValue = inputs.get('input');
    return {
      type: 'connector',
      value: inputValue,
      timestamp: Date.now()
    };
  }

  validateInputs(node: Node, inputs: Map<string, any>): ExecutionError[] {
    return [];
  }

  getRequiredInputs(node: Node): string[] {
    return ['input'];
  }

  getOutputs(node: Node): string[] {
    return ['output'];
  }
}

/**
 * ノード実行制御の中央管理クラス
 */
export class NodeExecutor {
  private executors = new Map<string, INodeExecutor>();

  constructor() {
    this.registerExecutors();
  }

  /**
   * 標準実行器を登録
   */
  private registerExecutors(): void {
    this.executors.set('memo', new MemoNodeExecutor());
    this.executors.set('file', new FileNodeExecutor());
    this.executors.set('function', new FunctionNodeExecutor());
    this.executors.set('connector', new ConnectorNodeExecutor());
  }

  /**
   * カスタム実行器を登録
   */
  public registerExecutor(nodeType: string, executor: INodeExecutor): void {
    this.executors.set(nodeType, executor);
  }

  /**
   * ノードを実行
   */
  public async executeNode(
    node: Node, 
    context: ExecutionContext, 
    inputs: Map<string, any>
  ): Promise<any> {
    const executor = this.executors.get(node.type || 'default');
    if (!executor) {
      throw new Error(`サポートされていないノードタイプ: ${node.type}`);
    }

    // 入力検証
    const validationErrors = executor.validateInputs(node, inputs);
    if (validationErrors.length > 0) {
      throw new Error(`入力検証エラー: ${validationErrors.map(e => e.message).join(', ')}`);
    }

    // 実行前の状態更新
    this.updateExecutionState(node.id, context, {
      status: ExecutionStatus.RUNNING,
      startTime: Date.now(),
      progress: 0
    });

    try {
      // 実行
      const result = await executor.execute(node, context, inputs);

      // 完了状態更新
      this.updateExecutionState(node.id, context, {
        status: ExecutionStatus.COMPLETED,
        endTime: Date.now(),
        output: result,
        progress: 100
      });

      return result;
    } catch (error) {
      // エラー状態更新
      this.updateExecutionState(node.id, context, {
        status: ExecutionStatus.FAILED,
        endTime: Date.now(),
        error: error instanceof Error ? error.message : '不明なエラー',
        progress: 0
      });

      throw error;
    }
  }

  /**
   * ノードの入力要件を取得
   */
  public getNodeRequirements(node: Node): {
    requiredInputs: string[];
    outputs: string[];
    validationErrors: ExecutionError[];
  } {
    const executor = this.executors.get(node.type || 'default');
    if (!executor) {
      return {
        requiredInputs: [],
        outputs: [],
        validationErrors: [{
          type: 'validation',
          nodeId: node.id,
          message: `サポートされていないノードタイプ: ${node.type}`,
          timestamp: Date.now()
        }]
      };
    }

    return {
      requiredInputs: executor.getRequiredInputs(node),
      outputs: executor.getOutputs(node),
      validationErrors: executor.validateInputs(node, new Map())
    };
  }

  /**
   * 実行状態を更新
   */
  private updateExecutionState(
    nodeId: string, 
    context: ExecutionContext, 
    updates: Partial<NodeExecutionState>
  ): void {
    const currentState = context.nodeStates.get(nodeId) || {
      nodeId,
      status: ExecutionStatus.PENDING
    };

    const newState = { ...currentState, ...updates };
    context.nodeStates.set(nodeId, newState);
  }

  /**
   * 利用可能な実行器一覧を取得
   */
  public getAvailableExecutors(): string[] {
    return Array.from(this.executors.keys());
  }

  /**
   * ノードタイプの実行時間を推定
   */
  public estimateExecutionTime(node: Node): number {
    // ノードタイプ別の推定実行時間（ミリ秒）
    switch (node.type) {
      case 'memo':
        return 50;
      case 'file':
        return 200;
      case 'function':
        return 2000;
      case 'connector':
        return 10;
      default:
        return 1000;
    }
  }
}