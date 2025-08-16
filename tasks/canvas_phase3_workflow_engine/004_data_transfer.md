# Canvas Phase 3 - タスク004: データ転送システム

## 概要
ノード間のデータ転送を管理し、型安全性とパフォーマンスを確保するシステムを実装する。

## 実装内容

### 対象ファイル
- `src/engine/DataTransfer.ts` (新規作成)
- `src/engine/DataType.ts` (新規作成)
- `src/engine/Serializer.ts` (新規作成)

### DataTransfer クラス

#### 主要機能
1. **データ転送**: ノード間の安全なデータ転送
2. **型変換**: 異なるデータ型間の自動変換
3. **ストリーミング**: 大容量データのストリーミング転送
4. **キャッシュ**: 転送データのキャッシュと再利用

#### インターフェース定義
```typescript
interface DataHandle {
  id: string;
  nodeId: string;
  type: 'input' | 'output';
  dataType: DataType;
  name: string;
  required: boolean;
  defaultValue?: any;
}

interface DataConnection {
  id: string;
  sourceHandle: string;
  targetHandle: string;
  transform?: DataTransform;
}

interface DataPacket {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  handleId: string;
  data: any;
  dataType: DataType;
  timestamp: Date;
  metadata?: Record<string, any>;
}

enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  STREAM = 'stream',
  FILE = 'file',
  BUFFER = 'buffer'
}
```

#### 実装メソッド
1. `transferData(connection, data): Promise<void>`
2. `validateDataType(data, expectedType): boolean`
3. `convertDataType(data, fromType, toType): any`
4. `streamLargeData(data, connection): AsyncIterable<any>`
5. `cacheData(key, data, ttl): void`
6. `getCachedData(key): any`

### データ型システム

#### 基本データ型
- **string**: テキストデータ
- **number**: 数値データ
- **boolean**: 真偽値
- **object**: JSON オブジェクト
- **array**: 配列データ
- **stream**: ストリームデータ
- **file**: ファイル参照
- **buffer**: バイナリデータ

#### 型変換規則
```typescript
const conversionRules: Record<DataType, Record<DataType, Function>> = {
  [DataType.STRING]: {
    [DataType.NUMBER]: (value) => parseFloat(value),
    [DataType.BOOLEAN]: (value) => value.toLowerCase() === 'true',
    [DataType.OBJECT]: (value) => JSON.parse(value),
    [DataType.ARRAY]: (value) => value.split(',').map(s => s.trim())
  },
  [DataType.NUMBER]: {
    [DataType.STRING]: (value) => value.toString(),
    [DataType.BOOLEAN]: (value) => value !== 0
  },
  // ... 他の変換規則
};
```

### ストリーミング機能

#### 大容量データ処理
- チャンク単位での転送
- バックプレッシャー制御
- エラー時の復旧機能

#### ストリームインターフェース
```typescript
interface DataStream {
  id: string;
  source: string;
  target: string;
  chunkSize: number;
  totalSize?: number;
  progress: number;
  status: 'active' | 'paused' | 'completed' | 'error';
}

class StreamManager {
  createStream(source, target, options): DataStream;
  pauseStream(streamId): void;
  resumeStream(streamId): void;
  cancelStream(streamId): void;
  getStreamProgress(streamId): number;
}
```

### キャッシュシステム

#### キャッシュ戦略
- LRU（Least Recently Used）キャッシュ
- TTL（Time To Live）ベースの自動削除
- メモリ使用量制限

#### キャッシュ設定
```typescript
interface CacheConfig {
  maxSize: number;        // 最大キャッシュサイズ（MB）
  defaultTTL: number;     // デフォルトTTL（秒）
  compressionEnabled: boolean; // 圧縮の有効化
  persistToDisk: boolean; // ディスクへの永続化
}
```

### データ検証

#### スキーマ検証
```typescript
interface DataSchema {
  type: DataType;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    enum?: any[];
    custom?: (value: any) => boolean;
  };
}
```

#### 検証機能
- 型適合性チェック
- 値の範囲検証
- カスタム検証ルール
- セキュリティチェック

## 完了条件
- [ ] DataTransfer クラスが実装されている
- [ ] 基本的なデータ転送が動作する
- [ ] 型変換システムが正常に動作する
- [ ] ストリーミング機能が実装されている
- [ ] キャッシュシステムが動作する
- [ ] データ検証が正確である

## パフォーマンス要件
- 小データ転送: < 10ms
- 大データストリーミング: > 10MB/s
- キャッシュヒット率: > 80%
- メモリ使用量: < 100MB

## セキュリティ要件
- データの暗号化（必要時）
- アクセス権限の検証
- インジェクション攻撃の防止

## 関連タスク
- 003_node_executor.mdと連携
- 005_state_management.mdで状態管理