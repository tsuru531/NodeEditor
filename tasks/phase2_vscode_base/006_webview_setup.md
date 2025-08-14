# タスク006: WebViewパネル設定

## 目的
WebViewパネルとReactアプリケーションの連携を設定する

## 前提条件
- タスク005が完了している
- NodeEditorPanelクラスが存在する

## 実装内容

### 1. src/webview/index.htmlの作成
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" 
          content="default-src 'none'; 
                   img-src {{cspSource}} https: data:; 
                   script-src {{cspSource}} 'unsafe-inline'; 
                   style-src {{cspSource}} 'unsafe-inline';">
    <title>Bash Node Editor</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        #root {
            width: 100vw;
            height: 100vh;
        }
    </style>
</head>
<body>
    <div id="root"></div>
</body>
</html>
```

### 2. NodeEditorPanel.tsの更新 - HTML生成メソッド
```typescript
private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
    );
    const styleUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.css')
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" 
                  content="default-src 'none'; 
                           img-src ${webview.cspSource} https: data:; 
                           script-src 'nonce-${nonce}' 'unsafe-eval'; 
                           style-src ${webview.cspSource} 'unsafe-inline';">
            <link href="${styleUri}" rel="stylesheet">
            <title>Bash Node Editor</title>
        </head>
        <body>
            <div id="root"></div>
            <script nonce="${nonce}">
                const vscode = acquireVsCodeApi();
                window.vscode = vscode;
            </script>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
```

### 3. src/webview/App.tsxの基本実装
```typescript
import React, { useState, useEffect } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

declare global {
    interface Window {
        vscode: {
            postMessage: (message: any) => void;
        };
    }
}

const App: React.FC = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        // Listen for messages from VSCode extension
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.command) {
                case 'loadScript':
                    // Parse script and update nodes/edges
                    loadScriptAsNodes(message.content);
                    break;
                case 'updateNodes':
                    setNodes(message.nodes);
                    setEdges(message.edges);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const loadScriptAsNodes = (scriptContent: string) => {
        // TODO: Parse script and convert to nodes
        console.log('Loading script:', scriptContent);
    };

    const saveNodes = () => {
        window.vscode.postMessage({
            command: 'saveScript',
            nodes: nodes,
            edges: edges,
        });
    };

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
            >
                <Background />
                <Controls />
                <MiniMap />
            </ReactFlow>
            <button 
                onClick={saveNodes}
                style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 10,
                }}
            >
                Save
            </button>
        </div>
    );
};

export default App;
```

### 4. src/webview/index.tsxの作成
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
```

### 5. メッセージングインターフェースの定義
```typescript
// src/common/messages.ts
export interface LoadScriptMessage {
    command: 'loadScript';
    content: string;
}

export interface SaveScriptMessage {
    command: 'saveScript';
    nodes: any[];
    edges: any[];
}

export interface UpdateNodesMessage {
    command: 'updateNodes';
    nodes: any[];
    edges: any[];
}

export type WebviewMessage = 
    | LoadScriptMessage 
    | SaveScriptMessage 
    | UpdateNodesMessage;
```

## 成果物
- src/webview/index.html
- src/webview/App.tsx
- src/webview/index.tsx
- src/common/messages.ts
- 更新されたNodeEditorPanel.ts

## テスト方法
1. `npm run compile` でコンパイルが成功する
2. F5でデバッグ実行し、WebViewパネルが表示されることを確認
3. React Flowの基本コンポーネントが表示されることを確認

## 完了条件
- [ ] WebView用HTMLテンプレートが作成されている
- [ ] Reactアプリケーションの基本構造が実装されている
- [ ] VSCode拡張機能とWebView間のメッセージングが設定されている
- [ ] React Flowが統合されている
- [ ] CSP（Content Security Policy）が正しく設定されている