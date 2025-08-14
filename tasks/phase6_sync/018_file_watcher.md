# タスク018: ファイル監視

## 目的
Bashスクリプトファイルの変更を監視し、リアルタイムで変更を検出する機能を実装する

## 前提条件
- Phase 5のタスクが完了している
- VSCode FileSystemWatcher APIが利用可能

## 実装内容

### 1. ファイル監視クラスの実装
```typescript
// src/sync/fileWatcher.ts
import * as vscode from 'vscode';
import { EventEmitter } from 'events';

export interface FileChangeEvent {
  type: 'created' | 'changed' | 'deleted';
  uri: vscode.Uri;
  content?: string;
  timestamp: number;
}

export class BashScriptWatcher extends EventEmitter implements vscode.Disposable {
  private watchers: Map<string, vscode.FileSystemWatcher> = new Map();
  private disposables: vscode.Disposable[] = [];
  private fileContents: Map<string, string> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private debounceDelay: number;

  constructor(debounceDelay: number = 500) {
    super();
    this.debounceDelay = debounceDelay;
    this.initializeGlobalWatcher();
  }

  private initializeGlobalWatcher(): void {
    // Watch all bash script files in workspace
    const pattern = '**/*.{sh,bash}';
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);

    watcher.onDidCreate(uri => this.handleFileCreated(uri));
    watcher.onDidChange(uri => this.handleFileChanged(uri));
    watcher.onDidDelete(uri => this.handleFileDeleted(uri));

    this.disposables.push(watcher);
  }

  watchFile(uri: vscode.Uri): void {
    const path = uri.fsPath;

    if (this.watchers.has(path)) {
      return; // Already watching
    }

    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(uri, '*')
    );

    watcher.onDidChange(() => this.handleFileChanged(uri));
    watcher.onDidDelete(() => this.handleFileDeleted(uri));

    this.watchers.set(path, watcher);
    this.disposables.push(watcher);

    // Store initial content
    this.readFileContent(uri).then(content => {
      this.fileContents.set(path, content);
    });
  }

  unwatchFile(uri: vscode.Uri): void {
    const path = uri.fsPath;
    const watcher = this.watchers.get(path);

    if (watcher) {
      watcher.dispose();
      this.watchers.delete(path);
      this.fileContents.delete(path);
      
      const timer = this.debounceTimers.get(path);
      if (timer) {
        clearTimeout(timer);
        this.debounceTimers.delete(path);
      }
    }
  }

  private handleFileCreated(uri: vscode.Uri): void {
    this.emitChange({
      type: 'created',
      uri,
      timestamp: Date.now(),
    });
  }

  private handleFileChanged(uri: vscode.Uri): void {
    const path = uri.fsPath;

    // Clear existing timer
    const existingTimer = this.debounceTimers.get(path);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounced timer
    const timer = setTimeout(async () => {
      const content = await this.readFileContent(uri);
      const previousContent = this.fileContents.get(path);

      // Only emit if content actually changed
      if (content !== previousContent) {
        this.fileContents.set(path, content);
        this.emitChange({
          type: 'changed',
          uri,
          content,
          timestamp: Date.now(),
        });
      }

      this.debounceTimers.delete(path);
    }, this.debounceDelay);

    this.debounceTimers.set(path, timer);
  }

  private handleFileDeleted(uri: vscode.Uri): void {
    const path = uri.fsPath;
    
    this.fileContents.delete(path);
    this.unwatchFile(uri);

    this.emitChange({
      type: 'deleted',
      uri,
      timestamp: Date.now(),
    });
  }

  private async readFileContent(uri: vscode.Uri): Promise<string> {
    try {
      const document = await vscode.workspace.openTextDocument(uri);
      return document.getText();
    } catch (error) {
      console.error(`Failed to read file ${uri.fsPath}:`, error);
      return '';
    }
  }

  private emitChange(event: FileChangeEvent): void {
    this.emit('fileChanged', event);
  }

  dispose(): void {
    // Clear all timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Dispose all watchers
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
    this.watchers.clear();
    this.fileContents.clear();

    this.removeAllListeners();
  }
}
```

### 2. 変更検出とdiff生成
```typescript
// src/sync/changeDetector.ts
export interface Change {
  type: 'add' | 'remove' | 'modify';
  line: number;
  content: string;
  oldContent?: string;
}

export class ChangeDetector {
  detectChanges(oldContent: string, newContent: string): Change[] {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const changes: Change[] = [];

    // Simple line-by-line diff (can be replaced with more sophisticated algorithm)
    const maxLength = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLength; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === undefined && newLine !== undefined) {
        // Line added
        changes.push({
          type: 'add',
          line: i + 1,
          content: newLine,
        });
      } else if (oldLine !== undefined && newLine === undefined) {
        // Line removed
        changes.push({
          type: 'remove',
          line: i + 1,
          content: oldLine,
        });
      } else if (oldLine !== newLine) {
        // Line modified
        changes.push({
          type: 'modify',
          line: i + 1,
          content: newLine,
          oldContent: oldLine,
        });
      }
    }

    return changes;
  }

  applyChangesToNodes(
    changes: Change[],
    nodes: FlowNode[],
    ast: AST.Script
  ): { nodes: FlowNode[], edges: FlowEdge[] } {
    // Map line numbers to AST nodes
    const lineMapping = this.createLineMapping(ast);

    // Apply changes to affected nodes
    for (const change of changes) {
      const affectedNode = lineMapping.get(change.line);
      if (affectedNode) {
        this.updateNode(affectedNode, change, nodes);
      }
    }

    // Regenerate edges if necessary
    const edges = this.regenerateEdges(nodes, ast);

    return { nodes, edges };
  }

  private createLineMapping(ast: AST.Script): Map<number, string> {
    // Create mapping from line numbers to node IDs
    const mapping = new Map<number, string>();
    
    // This would require line number information in AST
    // For now, return empty map
    return mapping;
  }

  private updateNode(nodeId: string, change: Change, nodes: FlowNode[]): void {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Update node based on change type
    switch (change.type) {
      case 'modify':
        // Parse the modified content and update node data
        this.updateNodeData(node, change.content);
        break;
      case 'add':
        // Handle added content
        break;
      case 'remove':
        // Mark node for removal
        node.data._deleted = true;
        break;
    }
  }

  private updateNodeData(node: FlowNode, content: string): void {
    // Parse content and update node data accordingly
    // This depends on node type
    if (node.type === 'command') {
      const parsed = this.parseCommandLine(content);
      node.data.command = parsed.command;
      node.data.args = parsed.args;
    }
    // Handle other node types...
  }

  private parseCommandLine(line: string): { command: string, args: string[] } {
    const parts = line.trim().split(/\s+/);
    return {
      command: parts[0] || '',
      args: parts.slice(1),
    };
  }

  private regenerateEdges(nodes: FlowNode[], ast: AST.Script): FlowEdge[] {
    // Regenerate edges based on AST structure
    const edges: FlowEdge[] = [];
    
    // Implementation would analyze AST and create appropriate edges
    
    return edges;
  }
}
```

### 3. 変更イベントハンドラー
```typescript
// src/sync/changeHandler.ts
import { FileChangeEvent } from './fileWatcher';
import { BashScriptParser } from '../parser/BashScriptParser';
import { ASTToNodeConverter } from '../generator/ASTToNodeConverter';
import { NodeEditorPanel } from '../extension/NodeEditorPanel';

export class ChangeHandler {
  private parser: BashScriptParser;
  private converter: ASTToNodeConverter;
  private changeDetector: ChangeDetector;

  constructor() {
    this.parser = new BashScriptParser();
    this.converter = new ASTToNodeConverter();
    this.changeDetector = new ChangeDetector();
  }

  async handleFileChange(event: FileChangeEvent, panel: NodeEditorPanel): Promise<void> {
    switch (event.type) {
      case 'changed':
        await this.handleContentChange(event, panel);
        break;
      case 'deleted':
        await this.handleFileDeletion(event, panel);
        break;
      case 'created':
        await this.handleFileCreation(event, panel);
        break;
    }
  }

  private async handleContentChange(
    event: FileChangeEvent,
    panel: NodeEditorPanel
  ): Promise<void> {
    if (!event.content) return;

    try {
      // Parse the new content
      const ast = this.parser.parse(event.content);

      // Convert to nodes
      const { nodes, edges } = this.converter.convert(ast);

      // Send update to webview
      panel.updateNodes(nodes, edges);

      // Store the new state
      panel.setCurrentState({
        ast,
        nodes,
        edges,
        scriptContent: event.content,
      });
    } catch (error) {
      console.error('Failed to handle file change:', error);
      vscode.window.showErrorMessage(
        `Failed to parse changed script: ${error.message}`
      );
    }
  }

  private async handleFileDeletion(
    event: FileChangeEvent,
    panel: NodeEditorPanel
  ): Promise<void> {
    const response = await vscode.window.showWarningMessage(
      'The script file has been deleted. Do you want to close the editor?',
      'Close Editor',
      'Keep Open'
    );

    if (response === 'Close Editor') {
      panel.dispose();
    }
  }

  private async handleFileCreation(
    event: FileChangeEvent,
    panel: NodeEditorPanel
  ): Promise<void> {
    const response = await vscode.window.showInformationMessage(
      'A new script file has been created. Do you want to open it?',
      'Open',
      'Ignore'
    );

    if (response === 'Open') {
      NodeEditorPanel.createOrShow(panel.extensionUri, event.uri);
    }
  }
}
```

### 4. ファイル監視マネージャー
```typescript
// src/sync/watchManager.ts
export class WatchManager {
  private watcher: BashScriptWatcher;
  private handler: ChangeHandler;
  private activePanels: Map<string, NodeEditorPanel> = new Map();
  private config: vscode.WorkspaceConfiguration;

  constructor(context: vscode.ExtensionContext) {
    this.config = vscode.workspace.getConfiguration('bashNodeEditor');
    const delay = this.config.get<number>('syncDelay', 500);
    
    this.watcher = new BashScriptWatcher(delay);
    this.handler = new ChangeHandler();

    this.setupEventListeners();
    context.subscriptions.push(this.watcher);
  }

  private setupEventListeners(): void {
    this.watcher.on('fileChanged', async (event: FileChangeEvent) => {
      const panel = this.activePanels.get(event.uri.fsPath);
      
      if (panel) {
        await this.handler.handleFileChange(event, panel);
      }
    });

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('bashNodeEditor.syncDelay')) {
        const newDelay = this.config.get<number>('syncDelay', 500);
        this.watcher.debounceDelay = newDelay;
      }
    });
  }

  registerPanel(uri: vscode.Uri, panel: NodeEditorPanel): void {
    const path = uri.fsPath;
    
    this.activePanels.set(path, panel);
    this.watcher.watchFile(uri);

    // Clean up when panel is disposed
    panel.onDidDispose(() => {
      this.unregisterPanel(uri);
    });
  }

  unregisterPanel(uri: vscode.Uri): void {
    const path = uri.fsPath;
    
    this.activePanels.delete(path);
    
    // Only unwatch if no other panels are using this file
    if (!this.hasActivePanels(uri)) {
      this.watcher.unwatchFile(uri);
    }
  }

  private hasActivePanels(uri: vscode.Uri): boolean {
    return this.activePanels.has(uri.fsPath);
  }

  getActivePanel(uri: vscode.Uri): NodeEditorPanel | undefined {
    return this.activePanels.get(uri.fsPath);
  }

  dispose(): void {
    this.activePanels.clear();
    this.watcher.dispose();
  }
}
```

## 成果物
- src/sync/fileWatcher.ts
- src/sync/changeDetector.ts
- src/sync/changeHandler.ts
- src/sync/watchManager.ts

## テスト方法
1. ファイルの変更が検出される
2. デバウンス処理が正しく動作する
3. 複数ファイルの同時監視が可能
4. パネルとファイルの関連付けが正しく管理される
5. 設定変更が即座に反映される

## 完了条件
- [ ] ファイル監視が実装されている
- [ ] 変更検出が正しく動作する
- [ ] デバウンス処理が実装されている
- [ ] 変更イベントが適切に処理される
- [ ] リソースの適切な管理とクリーンアップが行われる