# Contributing to NodeEditor

NodeEditorへの貢献を検討していただき、ありがとうございます！

## 貢献の方法

### バグ報告

バグを見つけた場合は、以下の手順で報告してください：

1. 既存のIssueを検索して、同じ問題が報告されていないか確認
2. 新しいIssueを作成し、バグ報告テンプレートを使用
3. 可能な限り詳細な情報を提供（再現手順、環境情報など）

### 機能リクエスト

新機能の提案は大歓迎です：

1. 既存のIssueを確認
2. 機能リクエストテンプレートを使用してIssueを作成
3. 機能の必要性と実装アイデアを説明

### プルリクエスト

#### 開発環境のセットアップ

```bash
# リポジトリをフォーク
# フォークしたリポジトリをクローン
git clone https://github.com/yourusername/NodeEditor.git
cd NodeEditor

# 上流リポジトリを追加
git remote add upstream https://github.com/originalowner/NodeEditor.git

# 依存関係をインストール
npm install
```

#### 開発フロー

1. **ブランチを作成**
   ```bash
   git checkout -b feature/your-feature-name
   # または
   git checkout -b fix/issue-number
   ```

2. **変更を実装**
   - コーディング規約に従う
   - 適切なテストを追加
   - ドキュメントを更新

3. **テストを実行**
   ```bash
   npm run lint
   npm test
   npm run compile
   ```

4. **コミット**
   ```bash
   git add .
   git commit -m "feat: 新機能の説明"
   ```

   コミットメッセージの規約：
   - `feat:` 新機能
   - `fix:` バグ修正
   - `docs:` ドキュメントのみの変更
   - `style:` コードの意味に影響しない変更
   - `refactor:` リファクタリング
   - `test:` テストの追加・修正
   - `chore:` ビルドプロセスやツールの変更

5. **プッシュとPR作成**
   ```bash
   git push origin feature/your-feature-name
   ```
   GitHubでプルリクエストを作成

## コーディング規約

### TypeScript

- ESLintルールに従う
- 型定義を明確にする
- `any`型の使用を避ける

### スタイル

- Prettierでフォーマット
- インデント：スペース2つ
- セミコロン：あり
- クォート：シングルクォート

### ファイル構造

```
src/
├── extension/     # VSCode拡張機能関連
├── webview/      # UI コンポーネント
├── parser/       # パーサー関連
├── generator/    # コード生成
└── sync/         # 同期機能
```

### テスト

- 新機能には必ずテストを追加
- 既存のテストを壊さない
- カバレッジを維持または向上

## コミュニケーション

- 日本語または英語でOK
- 質問はDiscussionsまたはIssueで
- 重要な変更は事前に相談

## ライセンス

貢献されたコードはMITライセンスの下でリリースされます。

## 謝辞

すべての貢献者に感謝します！