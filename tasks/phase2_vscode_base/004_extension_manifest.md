# タスク004: Extension Manifest設定

## 目的
VSCode拡張機能のマニフェストファイル（package.json）を拡張機能用に設定する

## 前提条件
- Phase 1のタスクが完了している
- package.jsonが存在する

## 実装内容

### 1. package.jsonの拡張機能設定追加
```json
{
  "name": "bash-node-editor",
  "displayName": "Bash Node Editor",
  "description": "Visual node-based editor for Bash scripts",
  "version": "0.0.1",
  "publisher": "node-editor",
  "engines": {
    "vscode": "^1.74.0"
  },
  "categories": [
    "Programming Languages",
    "Visualization"
  ],
  "keywords": [
    "bash",
    "shell",
    "node editor",
    "visual programming"
  ],
  "icon": "resources/icons/icon.png",
  "galleryBanner": {
    "color": "#1e1e1e",
    "theme": "dark"
  },
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "bashNodeEditor.openEditor",
        "title": "Open Bash Node Editor",
        "category": "Bash Node Editor"
      },
      {
        "command": "bashNodeEditor.importScript",
        "title": "Import Bash Script to Node Editor",
        "category": "Bash Node Editor"
      },
      {
        "command": "bashNodeEditor.exportScript",
        "title": "Export Nodes to Bash Script",
        "category": "Bash Node Editor"
      }
    ],
    "menus": {
      "editor/context": [
        {
          "when": "resourceExtname == .sh || resourceExtname == .bash",
          "command": "bashNodeEditor.openEditor",
          "group": "navigation"
        }
      ],
      "explorer/context": [
        {
          "when": "resourceExtname == .sh || resourceExtname == .bash",
          "command": "bashNodeEditor.openEditor",
          "group": "navigation"
        }
      ]
    },
    "languages": [
      {
        "id": "bash",
        "extensions": [".sh", ".bash"]
      }
    ],
    "configuration": {
      "title": "Bash Node Editor",
      "properties": {
        "bashNodeEditor.autoSync": {
          "type": "boolean",
          "default": true,
          "description": "Automatically sync between script and node view"
        },
        "bashNodeEditor.syncDelay": {
          "type": "number",
          "default": 500,
          "description": "Delay in milliseconds before syncing changes"
        },
        "bashNodeEditor.theme": {
          "type": "string",
          "enum": ["light", "dark", "auto"],
          "default": "auto",
          "description": "Color theme for the node editor"
        }
      }
    }
  },
  "activationEvents": [
    "onCommand:bashNodeEditor.openEditor",
    "onCommand:bashNodeEditor.importScript",
    "onCommand:bashNodeEditor.exportScript",
    "onLanguage:bash"
  ]
}
```

### 2. アイコンファイルの作成
resources/icons/icon.png を作成（128x128ピクセル推奨）

### 3. README.mdの作成
```markdown
# Bash Node Editor

Visual node-based editor for Bash scripts in VSCode.

## Features
- Visual representation of Bash scripts as node graphs
- Drag-and-drop node editing
- Real-time synchronization between script and visual view
- Support for common Bash constructs

## Usage
1. Right-click on a .sh or .bash file
2. Select "Open Bash Node Editor"
3. Edit visually or in text mode
```

## 成果物
- 更新されたpackage.json（拡張機能設定付き）
- README.md
- resources/icons/icon.png

## テスト方法
1. `npm run compile` が正常に動作することを確認
2. package.jsonのJSON構造が正しいことを確認

## 完了条件
- [ ] package.jsonに拡張機能設定が追加されている
- [ ] コマンドが定義されている
- [ ] メニュー項目が設定されている
- [ ] 設定項目が定義されている
- [ ] アクティベーションイベントが設定されている