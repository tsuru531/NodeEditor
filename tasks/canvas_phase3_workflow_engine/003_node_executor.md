# Canvas Phase 3 - タスク003: ノード実行制御

## 概要
個別ノードの実行を制御し、VSCodeプロセスとの連携を管理するシステムを実装する。

## 実装内容

### 対象ファイル
- `src/engine/NodeExecutor.ts` (新規作成)
- `src/engine/executors/` (新規ディレクトリ)
  - `FunctionNodeExecutor.ts`
  - `MemoNodeExecutor.ts`
  - `FileNodeExecutor.ts`
  - `ConnectorNodeExecutor.ts`

### NodeExecutor基底クラス

#### 主要機能
1. **ノード実行**: ノードタイプに応じた実行処理
2. **プロセス管理**: 外部プロセスの生成と制御
3. **データ検証**: 入力データの妥当性検証
4. **出力処理**: 実行結果の正規化と出力

#### インターフェース定義
```typescript
interface ExecutionContext {
  nodeId: string;
  nodeType: string;
  nodeData: any;
  inputs: Record<string, any>;
  config: ExecutionConfig;
}

interface ExecutionResult {
  success: boolean;
  outputs: Record<string, any>;
  logs: string[];
  duration: number;
  error?: string;
  metadata?: Record<string, any>;
}

interface ExecutionConfig {
  timeout: number;
  workingDirectory: string;
  environment: Record<string, string>;
  retryPolicy?: RetryPolicy;
}

abstract class NodeExecutor {
  abstract execute(context: ExecutionContext): Promise<ExecutionResult>;
  abstract validate(context: ExecutionContext): boolean;
  abstract cancel(): Promise<void>;
}
```

### 個別ノード実行器

#### FunctionNodeExecutor
- bash関数の実行制御
- プロセス生成とモニタリング
- stdin/stdout/stderrの管理
- タイムアウト処理

```typescript
class FunctionNodeExecutor extends NodeExecutor {
  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    // bash関数実行の実装
  }
  
  private async executeBashFunction(
    functionCode: string,
    args: string[]
  ): Promise<ExecutionResult>
}
```

#### MemoNodeExecutor
- テキストメモの処理
- Markdownの解析と変換
- リンク解決

#### FileNodeExecutor
- ファイル読み込み/書き込み
- ファイル変更監視
- 権限チェック

#### ConnectorNodeExecutor
- データ変換処理
- フォーマット変換
- 条件分岐制御

### プロセス管理

#### VSCode連携
```typescript
interface VSCodeProcess {
  id: string;
  command: string;
  args: string[];
  cwd: string;
  env: Record<string, string>;
  pid?: number;
  status: 'starting' | 'running' | 'completed' | 'failed';
}
```

#### プロセス制御
- child_processによる外部プロセス実行
- プロセス間通信（IPC）
- リソース使用量監視
- 強制終了とクリーンアップ

### セキュリティ考慮

#### サンドボックス実行
- 作業ディレクトリの制限
- 環境変数の制御
- ファイルアクセス権限の検証

#### コード検証
- 危険なコマンドの検出
- インジェクション攻撃の防止
- リソース使用量の制限

## 完了条件
- [ ] 各ノードタイプの実行器が実装されている
- [ ] プロセス管理が正常に動作する
- [ ] セキュリティ制約が適用されている
- [ ] タイムアウト処理が動作する
- [ ] エラーハンドリングが適切である

## パフォーマンス要件
- プロセス起動時間 < 500ms
- 並列実行での安定動作
- メモリリークの防止

## セキュリティ要件
- サンドボックス環境での実行
- 危険なコマンドの検出と遮断
- リソース使用量の制限

## 関連タスク
- 002_execution_queue.mdから呼び出される
- 004_data_transfer.mdと連携