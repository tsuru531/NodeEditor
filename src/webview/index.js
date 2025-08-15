// 仮のWebViewエントリーポイント
// Phase 3でReactとReact Flowを実装予定

(function() {
    const vscode = window.vscode;
    
    // VSCodeからのメッセージを受信
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'setScript':
                console.log('Received script:', message.script);
                displayScript(message.script);
                break;
        }
    });

    function displayScript(script) {
        const root = document.getElementById('root');
        root.innerHTML = `
            <div style="padding: 20px;">
                <h2>Bash Script Viewer (Phase 3でノードエディタ実装予定)</h2>
                <pre style="background: #f4f4f4; padding: 10px; border-radius: 4px; overflow: auto;">
${escapeHtml(script)}
                </pre>
            </div>
        `;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 初期化時にスクリプトを要求
    vscode.postMessage({ command: 'getScript' });
})();