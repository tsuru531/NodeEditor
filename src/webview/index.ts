// WebView のメインエントリーポイント
declare const vscode: any;

// スタイルの定義
const styles = `
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 20px;
            line-height: 1.6;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .container {
            max-width: 100%;
            margin: 0 auto;
        }
        .script-content {
            background-color: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 15px;
            font-family: 'Courier New', Courier, monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-x: auto;
        }
        .header {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .status {
            color: var(--vscode-charts-green);
            font-size: 0.9em;
            margin-top: 10px;
        }
        .placeholder {
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
    </style>
`;

// 初期化関数
function initialize() {
    const root = document.getElementById('root');
    if (!root) {
        console.error('Root element not found');
        return;
    }

    // 初期HTMLを設定
    root.innerHTML = `
        ${styles}
        <div class="container">
            <div class="header">
                <h2>🔧 Bash Script Visual Editor</h2>
                <div class="status">✓ WebViewパネル接続完了</div>
            </div>
            <div class="script-content" id="scriptContent">
                <span class="placeholder">スクリプトを読み込み中...</span>
            </div>
        </div>
    `;

    // VSCodeからのメッセージを受信
    window.addEventListener('message', (event: MessageEvent) => {
        const message = event.data;
        switch (message.command) {
            case 'setScript':
                updateScriptContent(message.script);
                break;
        }
    });

    // 初期スクリプトを要求
    vscode.postMessage({
        command: 'getScript'
    });
}

// スクリプト内容を更新
function updateScriptContent(script: string) {
    const contentElement = document.getElementById('scriptContent');
    if (contentElement) {
        if (script && script.trim()) {
            // スクリプトをHTMLエスケープして表示
            const escapedScript = escapeHtml(script);
            contentElement.innerHTML = escapedScript;
        } else {
            contentElement.innerHTML = '<span class="placeholder">空のスクリプト</span>';
        }
    }
}

// HTMLエスケープ関数
function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// DOMContentLoadedイベントで初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}