/**
 * NodeCanvas プロジェクト管理モジュール
 * Canvas Phase 5: ファイル管理とプロジェクト機能
 */

// 型定義
export * from './types';

// プロジェクト管理
export { ProjectManager } from './ProjectManager';
export { ProjectSerializer } from './ProjectSerializer';

// ファイル管理
export { FileManager } from './FileManager';

// インポート/エクスポート
export { BashImporter } from './BashImporter';
export { BashExporter } from './BashExporter';

// テンプレート管理
export { TemplateManager } from './TemplateManager';

/**
 * Canvas Phase 5で実装された機能:
 * 
 * 1. プロジェクトファイル形式（.nodecanvas）
 *    - JSON形式でのワークフロー保存
 *    - メタデータとバージョン管理
 *    - ファイル参照の管理
 * 
 * 2. ファイル管理とファイル監視
 *    - FileNodeの自動同期機能
 *    - ファイル変更の検知とリアルタイム通知
 *    - 相対パス、絶対パス、埋め込みファイルの対応
 * 
 * 3. Bashスクリプトインポート/エクスポート
 *    - 既存のBashスクリプトからノードグラフの自動生成
 *    - ノードグラフからBashスクリプトの生成
 *    - 関数、変数、コマンドの解析と変換
 * 
 * 4. テンプレート機能
 *    - よく使うワークフローパターンのテンプレート化
 *    - パラメータ化されたテンプレートの適用
 *    - カテゴリ別の組み込みテンプレート
 * 
 * 5. VSCode統合
 *    - プロジェクト管理コマンドの追加
 *    - ファイル拡張子の関連付け
 *    - 最近使用したプロジェクトの管理
 */