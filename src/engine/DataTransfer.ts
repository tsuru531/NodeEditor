import { Edge } from 'reactflow';
import { 
  DataTransfer, 
  ExecutionContext,
  DataType,
  ExecutionError
} from './types';

/**
 * データ変換器インターフェース
 */
export interface IDataConverter {
  canConvert(fromType: DataType, toType: DataType): boolean;
  convert(data: any, fromType: DataType, toType: DataType): any;
}

/**
 * 基本データ変換器
 */
export class BasicDataConverter implements IDataConverter {
  canConvert(fromType: DataType, toType: DataType): boolean {
    // 同じ型は変換不要
    if (fromType === toType) return true;
    
    // サポートされている変換パターン
    const conversions = new Map([
      [`${DataType.STRING},${DataType.NUMBER}`, true],
      [`${DataType.NUMBER},${DataType.STRING}`, true],
      [`${DataType.BOOLEAN},${DataType.STRING}`, true],
      [`${DataType.STRING},${DataType.BOOLEAN}`, true],
      [`${DataType.OBJECT},${DataType.STRING}`, true],
      [`${DataType.ARRAY},${DataType.STRING}`, true],
    ]);
    
    return conversions.get(`${fromType},${toType}`) || false;
  }

  convert(data: any, fromType: DataType, toType: DataType): any {
    if (fromType === toType) return data;

    try {
      switch (`${fromType},${toType}`) {
        case `${DataType.STRING},${DataType.NUMBER}`:
          const num = parseFloat(data);
          if (isNaN(num)) throw new Error('数値に変換できません');
          return num;
        
        case `${DataType.NUMBER},${DataType.STRING}`:
          return data.toString();
        
        case `${DataType.BOOLEAN},${DataType.STRING}`:
          return data ? 'true' : 'false';
        
        case `${DataType.STRING},${DataType.BOOLEAN}`:
          return data.toLowerCase() === 'true' || data === '1';
        
        case `${DataType.OBJECT},${DataType.STRING}`:
          return JSON.stringify(data);
        
        case `${DataType.ARRAY},${DataType.STRING}`:
          return JSON.stringify(data);
        
        default:
          throw new Error(`変換できません: ${fromType} -> ${toType}`);
      }
    } catch (error) {
      throw new Error(`データ変換エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }
}

/**
 * データパイプライン
 */
export class DataPipeline {
  private transfers: DataTransfer[] = [];
  private converter: IDataConverter;

  constructor(converter: IDataConverter = new BasicDataConverter()) {
    this.converter = converter;
  }

  /**
   * データ転送を追加
   */
  public addTransfer(transfer: DataTransfer): void {
    this.transfers.push(transfer);
  }

  /**
   * データ転送を実行
   */
  public async processTransfer(transfer: DataTransfer, context: ExecutionContext): Promise<void> {
    try {
      // ソースノードの出力データを取得
      const sourceState = context.nodeStates.get(transfer.sourceNodeId);
      if (!sourceState || !sourceState.output) {
        throw new Error(`ソースノードの出力データが見つかりません: ${transfer.sourceNodeId}`);
      }

      // ハンドル固有のデータを抽出
      const sourceData = this.extractHandleData(sourceState.output, transfer.sourceHandle);
      
      // データ型変換が必要かチェック
      const convertedData = await this.convertDataIfNeeded(
        sourceData, 
        transfer.sourceNodeId, 
        transfer.targetNodeId, 
        context
      );

      // ターゲットノードにデータを設定
      this.setNodeInputData(transfer.targetNodeId, transfer.targetHandle, convertedData, context);

    } catch (error) {
      throw new Error(`データ転送エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  /**
   * ハンドル固有のデータを抽出
   */
  private extractHandleData(output: any, handleId: string): any {
    if (typeof output === 'object' && output !== null) {
      // ハンドルIDに対応するデータを取得
      if (handleId in output) {
        return output[handleId];
      }
      
      // デフォルトハンドルのマッピング
      const defaultMappings: Record<string, string> = {
        'output': 'result',
        'content': 'content',
        'value': 'value',
        'data': 'data'
      };
      
      const mappedKey = defaultMappings[handleId];
      if (mappedKey && mappedKey in output) {
        return output[mappedKey];
      }
    }
    
    // オブジェクト全体を返す
    return output;
  }

  /**
   * 必要に応じてデータ型変換を実行
   */
  private async convertDataIfNeeded(
    data: any,
    sourceNodeId: string,
    targetNodeId: string,
    context: ExecutionContext
  ): Promise<any> {
    const sourceNode = context.nodes.find(n => n.id === sourceNodeId);
    const targetNode = context.nodes.find(n => n.id === targetNodeId);
    
    if (!sourceNode || !targetNode) {
      return data;
    }

    // データ型を推定
    const sourceType = this.inferDataType(data);
    const expectedType = this.getExpectedInputType(targetNode);
    
    if (this.converter.canConvert(sourceType, expectedType)) {
      return this.converter.convert(data, sourceType, expectedType);
    }
    
    return data;
  }

  /**
   * データ型を推定
   */
  private inferDataType(data: any): DataType {
    if (typeof data === 'string') return DataType.STRING;
    if (typeof data === 'number') return DataType.NUMBER;
    if (typeof data === 'boolean') return DataType.BOOLEAN;
    if (Array.isArray(data)) return DataType.ARRAY;
    if (typeof data === 'object' && data !== null) return DataType.OBJECT;
    return DataType.STRING;
  }

  /**
   * ノードが期待する入力データ型を取得
   */
  private getExpectedInputType(node: any): DataType {
    // ノードタイプ別のデフォルト期待型
    switch (node.type) {
      case 'function':
        return DataType.STRING;
      case 'file':
        return DataType.STRING;
      case 'memo':
        return DataType.STRING;
      default:
        return DataType.STRING;
    }
  }

  /**
   * ノードの入力データを設定
   */
  private setNodeInputData(
    nodeId: string, 
    handleId: string, 
    data: any, 
    context: ExecutionContext
  ): void {
    // グローバルデータにノードの入力を保存
    const nodeInputKey = `${nodeId}_inputs`;
    let nodeInputs = context.globalData.get(nodeInputKey) || new Map();
    
    if (!(nodeInputs instanceof Map)) {
      nodeInputs = new Map();
    }
    
    nodeInputs.set(handleId, data);
    context.globalData.set(nodeInputKey, nodeInputs);
  }

  /**
   * 転送履歴をクリア
   */
  public clearTransfers(): void {
    this.transfers = [];
  }

  /**
   * 転送統計を取得
   */
  public getTransferStatistics(): {
    totalTransfers: number;
    averageTransferTime: number;
    successfulTransfers: number;
    failedTransfers: number;
  } {
    // 現在は基本統計のみ
    return {
      totalTransfers: this.transfers.length,
      averageTransferTime: 0,
      successfulTransfers: this.transfers.length,
      failedTransfers: 0
    };
  }
}

/**
 * データ転送システムの中央管理クラス
 */
export class DataTransferSystem {
  private pipeline: DataPipeline;
  private activeTransfers = new Map<string, Promise<void>>();

  constructor(converter?: IDataConverter) {
    this.pipeline = new DataPipeline(converter);
  }

  /**
   * エッジに基づいてデータ転送を実行
   */
  public async executeTransfer(edge: Edge, context: ExecutionContext): Promise<void> {
    const transferId = `${edge.source}-${edge.target}`;
    
    // 既に実行中の転送は待機
    if (this.activeTransfers.has(transferId)) {
      await this.activeTransfers.get(transferId);
      return;
    }

    const transfer: DataTransfer = {
      sourceNodeId: edge.source,
      targetNodeId: edge.target,
      sourceHandle: edge.sourceHandle || 'output',
      targetHandle: edge.targetHandle || 'input',
      data: null,
      timestamp: Date.now()
    };

    const transferPromise = this.pipeline.processTransfer(transfer, context);
    this.activeTransfers.set(transferId, transferPromise);

    try {
      await transferPromise;
    } finally {
      this.activeTransfers.delete(transferId);
    }
  }

  /**
   * 複数のエッジに対して一括転送を実行
   */
  public async executeBatchTransfer(edges: Edge[], context: ExecutionContext): Promise<void> {
    const transferPromises = edges.map(edge => this.executeTransfer(edge, context));
    await Promise.all(transferPromises);
  }

  /**
   * ノードの入力データを取得
   */
  public getNodeInputs(nodeId: string, context: ExecutionContext): Map<string, any> {
    const nodeInputKey = `${nodeId}_inputs`;
    const inputs = context.globalData.get(nodeInputKey);
    
    if (inputs instanceof Map) {
      return inputs;
    }
    
    return new Map();
  }

  /**
   * ノードの入力データをクリア
   */
  public clearNodeInputs(nodeId: string, context: ExecutionContext): void {
    const nodeInputKey = `${nodeId}_inputs`;
    context.globalData.delete(nodeInputKey);
  }

  /**
   * 全転送をキャンセル
   */
  public cancelAllTransfers(): void {
    this.activeTransfers.clear();
    this.pipeline.clearTransfers();
  }

  /**
   * データフロー検証
   */
  public validateDataFlow(edges: Edge[], context: ExecutionContext): ExecutionError[] {
    const errors: ExecutionError[] = [];

    for (const edge of edges) {
      const sourceNode = context.nodes.find(n => n.id === edge.source);
      const targetNode = context.nodes.find(n => n.id === edge.target);

      if (!sourceNode) {
        errors.push({
          type: 'validation',
          message: `ソースノードが見つかりません: ${edge.source}`,
          timestamp: Date.now()
        });
        continue;
      }

      if (!targetNode) {
        errors.push({
          type: 'validation',
          message: `ターゲットノードが見つかりません: ${edge.target}`,
          timestamp: Date.now()
        });
        continue;
      }

      // ハンドルの存在チェック（簡易実装）
      if (edge.sourceHandle && !this.hasOutputHandle(sourceNode, edge.sourceHandle)) {
        errors.push({
          type: 'validation',
          message: `ソースハンドルが存在しません: ${edge.sourceHandle}`,
          timestamp: Date.now()
        });
      }

      if (edge.targetHandle && !this.hasInputHandle(targetNode, edge.targetHandle)) {
        errors.push({
          type: 'validation',
          message: `ターゲットハンドルが存在しません: ${edge.targetHandle}`,
          timestamp: Date.now()
        });
      }
    }

    return errors;
  }

  /**
   * ノードが指定された出力ハンドルを持つかチェック
   */
  private hasOutputHandle(node: any, handleId: string): boolean {
    // 簡易実装：基本的なハンドルは常に存在すると仮定
    const commonOutputHandles = ['output', 'result', 'content', 'value'];
    return commonOutputHandles.includes(handleId);
  }

  /**
   * ノードが指定された入力ハンドルを持つかチェック
   */
  private hasInputHandle(node: any, handleId: string): boolean {
    // 簡易実装：基本的なハンドルは常に存在すると仮定
    const commonInputHandles = ['input', 'data', 'value', 'content'];
    return commonInputHandles.includes(handleId);
  }

  /**
   * 転送システムの統計情報を取得
   */
  public getSystemStatistics(): {
    activeTransfers: number;
    pipelineStats: any;
  } {
    return {
      activeTransfers: this.activeTransfers.size,
      pipelineStats: this.pipeline.getTransferStatistics()
    };
  }
}