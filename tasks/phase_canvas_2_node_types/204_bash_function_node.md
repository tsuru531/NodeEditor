# タスク 204: Bash関数ノード実装

## タスク概要

Bash関数の定義、編集、実行機能を持つBashFunctionNodeの実装を行う。ComfyUIライクな関数実行とデータフローを提供する。

## 前提条件

- タスク201（基本ノード構造）の完了
- Bash構文の理解
- child_processによるプロセス実行の理解

## 実装内容

### 1. BashFunctionNode データ構造

#### BashFunctionNodeData インターフェース
```typescript
interface BashFunctionNodeData extends BaseNodeData {
  type: NodeType.BASH_FUNCTION;
  functionName: string;       // 関数名
  functionBody: string;       // 関数本体
  parameters: Parameter[];    // 入力パラメータ
  outputs: OutputDefinition[]; // 出力定義
  workingDirectory: string;   // 作業ディレクトリ
  environment: EnvVar[];      // 環境変数
  timeout: number;            // タイムアウト（秒）
  isAsync: boolean;           // 非同期実行フラグ
  lastExecuted: Date | null;  // 最終実行日時
  executionHistory: ExecutionRecord[]; // 実行履歴
}

interface Parameter {
  name: string;               // パラメータ名
  type: ParameterType;        // データ型
  defaultValue?: string;      // デフォルト値
  required: boolean;          // 必須フラグ
  description: string;        // 説明
  validation?: ValidationRule; // バリデーションルール
}

enum ParameterType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  FILE_PATH = 'filepath',
  DIRECTORY = 'directory',
  ARRAY = 'array'
}

interface ValidationRule {
  pattern?: RegExp;           // 正規表現パターン
  minLength?: number;         // 最小長
  maxLength?: number;         // 最大長
  min?: number;               // 最小値（数値）
  max?: number;               // 最大値（数値）
}

interface OutputDefinition {
  name: string;               // 出力名
  type: ParameterType;        // データ型
  description: string;        // 説明
  source: OutputSource;       // 出力ソース
}

enum OutputSource {
  STDOUT = 'stdout',          // 標準出力
  STDERR = 'stderr',          // 標準エラー
  EXIT_CODE = 'exitCode',     // 終了コード
  FILE = 'file',              // ファイル出力
  VARIABLE = 'variable'       // 変数出力
}

interface EnvVar {
  name: string;
  value: string;
  isSecret: boolean;          // 秘匿情報フラグ
}

interface ExecutionRecord {
  id: string;
  timestamp: Date;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  duration: number;           // 実行時間（ms）
  exitCode: number;
  success: boolean;
  errorMessage?: string;
}
```

### 2. BashFunctionNodeコンポーネント実装

#### コンポーネント構造
```typescript
interface BashFunctionNodeProps extends BaseNodeProps {
  data: BashFunctionNodeData;
  onFunctionChange: (nodeId: string, functionData: Partial<BashFunctionNodeData>) => void;
  onExecute: (nodeId: string, inputs: Record<string, any>) => void;
  onParameterChange: (nodeId: string, parameters: Parameter[]) => void;
}

interface BashFunctionNodeState {
  isEditing: boolean;
  isExecuting: boolean;
  executionState: ExecutionState;
  currentInputs: Record<string, any>;
  validationErrors: ValidationError[];
  showHistory: boolean;
  showEnvironment: boolean;
}
```

### 3. 関数エディタ機能

#### Bashコードエディタ
```typescript
interface BashEditor {
  language: 'bash';
  features: {
    syntaxHighlighting: boolean;
    autoCompletion: boolean;
    errorUnderlines: boolean;
    functionValidation: boolean;
    parameterDetection: boolean;
  };
  snippets: BashSnippet[];
}

interface BashSnippet {
  name: string;
  prefix: string;
  body: string;
  description: string;
  category: SnippetCategory;
}

enum SnippetCategory {
  CONTROL_FLOW = 'controlFlow',
  FILE_OPERATIONS = 'fileOps',
  STRING_PROCESSING = 'stringOps',
  ARRAY_OPERATIONS = 'arrayOps',
  UTILITIES = 'utilities'
}
```

#### 関数テンプレート
```typescript
const functionTemplates: BashFunctionTemplate[] = [
  {
    name: 'Simple Function',
    description: '基本的な関数テンプレート',
    functionBody: `#!/bin/bash
function my_function() {
    local input_param="$1"
    echo "処理結果: $input_param"
    return 0
}`,
    parameters: [
      { name: 'input_param', type: ParameterType.STRING, required: true, description: '入力パラメータ' }
    ],
    outputs: [
      { name: 'result', type: ParameterType.STRING, source: OutputSource.STDOUT, description: '実行結果' }
    ]
  },
  {
    name: 'File Processor',
    description: 'ファイル処理関数',
    functionBody: `#!/bin/bash
function process_file() {
    local file_path="$1"
    local output_dir="$2"
    
    if [[ ! -f "$file_path" ]]; then
        echo "Error: File not found: $file_path" >&2
        return 1
    fi
    
    # ファイル処理ロジック
    cp "$file_path" "$output_dir/"
    echo "Processed: $(basename "$file_path")"
    return 0
}`,
    parameters: [
      { name: 'file_path', type: ParameterType.FILE_PATH, required: true, description: '処理対象ファイル' },
      { name: 'output_dir', type: ParameterType.DIRECTORY, required: true, description: '出力ディレクトリ' }
    ]
  }
];
```

### 4. 実行エンジン機能

#### プロセス実行
```typescript
interface BashExecutor {
  executeFunction(
    functionData: BashFunctionNodeData,
    inputs: Record<string, any>
  ): Promise<ExecutionResult>;
  
  validateInputs(
    parameters: Parameter[],
    inputs: Record<string, any>
  ): ValidationResult;
  
  cancelExecution(executionId: string): void;
}

interface ExecutionResult {
  success: boolean;
  outputs: Record<string, any>;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  error?: Error;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```

#### 安全な実行環境
```typescript
interface ExecutionEnvironment {
  sandbox: boolean;           // サンドボックス実行
  allowedCommands: string[];  // 許可コマンド一覧
  blockedCommands: string[];  // 禁止コマンド一覧
  maxMemory: number;          // 最大メモリ使用量
  maxCpuTime: number;         // 最大CPU時間
  networkAccess: boolean;     // ネットワークアクセス許可
  fileSystemAccess: 'none' | 'readonly' | 'readwrite'; // ファイルシステムアクセス
}
```

### 5. パラメータ管理UI

#### 入力パラメータエディタ
```typescript
interface ParameterEditor {
  addParameter(): void;
  removeParameter(index: number): void;
  updateParameter(index: number, parameter: Partial<Parameter>): void;
  reorderParameters(fromIndex: number, toIndex: number): void;
  validateParameter(parameter: Parameter): ValidationResult;
}
```

#### 動的フォーム生成
```typescript
interface DynamicForm {
  generateInputForm(parameters: Parameter[]): JSX.Element;
  validateForm(values: Record<string, any>): boolean;
  getFormValues(): Record<string, any>;
  resetForm(): void;
}
```

### 6. 実行結果表示

#### 出力ビューア
```typescript
interface OutputViewer {
  stdout: string;             // 標準出力
  stderr: string;             // 標準エラー
  exitCode: number;           // 終了コード
  executionTime: number;      // 実行時間
  customOutputs: Record<string, any>; // カスタム出力
}
```

#### 実行履歴
```typescript
interface ExecutionHistory {
  records: ExecutionRecord[];
  maxRecords: number;
  showDetails(recordId: string): void;
  clearHistory(): void;
  exportHistory(): string;
}
```

## 技術詳細

### ファイル構造
```
src/webview/components/nodes/BashFunctionNode/
├── index.tsx                    # BashFunctionNodeメインコンポーネント
├── BashFunctionNode.module.css  # スタイル定義
├── BashEditor.tsx               # Bash関数エディタ
├── ParameterEditor.tsx          # パラメータ設定エディタ
├── ExecutionPanel.tsx           # 実行パネル
├── OutputViewer.tsx             # 実行結果表示
├── ExecutionHistory.tsx         # 実行履歴
├── FunctionTemplates.tsx        # 関数テンプレート
├── SecuritySettings.tsx         # セキュリティ設定
└── hooks/
    ├── useBashExecution.ts      # Bash実行管理
    ├── useParameterValidation.ts # パラメータバリデーション
    └── useExecutionHistory.ts   # 実行履歴管理
```

### VS Code拡張機能連携
```typescript
// Extension側でのBash実行処理
interface BashExecutionService {
  executeFunction(request: BashExecutionRequest): Promise<BashExecutionResponse>;
  validateFunction(functionBody: string): Promise<ValidationResult>;
  getSystemInfo(): Promise<SystemInfo>;
}

interface BashExecutionRequest {
  functionBody: string;
  inputs: Record<string, any>;
  workingDirectory: string;
  environment: EnvVar[];
  timeout: number;
  securitySettings: ExecutionEnvironment;
}
```

## 完了条件

- [ ] BashFunctionNodeDataインターフェースが定義されている
- [ ] BashFunctionNodeコンポーネントが実装されている
- [ ] Bashコードエディタが動作する
- [ ] パラメータエディタが動作する
- [ ] 関数実行機能が動作する
- [ ] 実行結果が表示される
- [ ] 入力バリデーションが動作する
- [ ] 実行履歴が記録される
- [ ] エラーハンドリングが適切に動作する
- [ ] セキュリティ制限が機能する
- [ ] 関数テンプレートが利用できる
- [ ] 非同期実行が動作する

## テスト項目

- [ ] 基本的なBash関数の実行が成功する
- [ ] パラメータ付き関数の実行が成功する
- [ ] エラー時の適切なハンドリングが動作する
- [ ] タイムアウト処理が動作する
- [ ] 入力バリデーションが正しく動作する
- [ ] 実行履歴の記録・表示が動作する
- [ ] セキュリティ制限が適切に機能する
- [ ] 大量データの処理が安定動作する
- [ ] 並列実行が正常に動作する
- [ ] ノード間のデータフローが動作する

## 参考資料

- [Node.js child_process](https://nodejs.org/api/child_process.html)
- [Bash Scripting Guide](https://tldp.org/LDP/Bash-Beginners-Guide/html/)
- [VS Code Process API](https://code.visualstudio.com/api/references/vscode-api#Process)
- [ComfyUI Node System](https://github.com/comfyanonymous/ComfyUI/wiki/How-to-write-a-custom-node)

## セキュリティ考慮事項

- **コマンドインジェクション対策**: 入力の厳密な検証
- **ファイルシステムアクセス制限**: サンドボックス環境での実行
- **リソース使用量制限**: メモリ・CPU使用量の監視
- **ネットワークアクセス制御**: 必要に応じた通信制限
- **権限管理**: 最小権限での実行
- **ログ管理**: 実行ログの適切な記録と管理

## 実装順序

1. BashFunctionNodeDataインターフェースの定義
2. 基本的なBashFunctionNodeコンポーネントの実装
3. Bashコードエディタの実装
4. パラメータエディタの実装
5. 基本的な関数実行機能の実装
6. セキュリティ機能の実装
7. 実行結果表示の実装
8. 実行履歴機能の実装
9. 関数テンプレート機能の実装
10. エラーハンドリングとテスト