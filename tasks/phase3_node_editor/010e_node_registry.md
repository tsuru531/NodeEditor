# タスク010e: ノードレジストリシステムの設計

## 目的
新しいコマンドノードを簡単に追加・管理できる拡張可能なレジストリシステムを実装する

## 背景
Bashコマンドは数百種類存在し、将来的に多くのノードを追加する必要があるため、体系的な管理システムが必要

## 前提条件
- タスク010dが完了している
- 基本的なコマンドノードが実装されている

## 実装内容

### 1. ノード定義インターフェース
```typescript
// src/webview/types/NodeRegistry.ts
import { FC } from 'react';
import { NodeProps } from 'reactflow';

export interface NodeOption {
  name: string;
  flag: string;
  type: 'boolean' | 'string' | 'number' | 'select';
  default?: any;
  description: string;
  values?: string[]; // for select type
}

export interface NodeInput {
  id: string;
  label: string;
  type: 'stdin' | 'file' | 'data';
  required: boolean;
  description: string;
}

export interface NodeOutput {
  id: string;
  label: string;
  type: 'stdout' | 'stderr' | 'data';
  description: string;
}

export interface NodeDefinition {
  type: string;
  category: 'input' | 'output' | 'transform' | 'control' | 'file' | 'network' | 'custom';
  label: string;
  icon: string;
  description: string;
  documentation?: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  options: NodeOption[];
  component: FC<NodeProps>;
  generateCommand?: (data: any) => string;
}

export interface NodeCategory {
  name: string;
  label: string;
  icon: string;
  description: string;
  color: string;
}
```

### 2. ノードレジストリクラス
```typescript
// src/webview/services/NodeRegistry.ts
import { NodeTypes } from 'reactflow';
import { NodeDefinition, NodeCategory } from '../types/NodeRegistry';

class NodeRegistryService {
  private nodes: Map<string, NodeDefinition> = new Map();
  private categories: Map<string, NodeCategory> = new Map();

  constructor() {
    this.initializeCategories();
  }

  private initializeCategories() {
    this.registerCategory({
      name: 'input',
      label: 'Input',
      icon: '📥',
      description: 'Input nodes for data entry',
      color: '#4CAF50'
    });

    this.registerCategory({
      name: 'output',
      label: 'Output',
      icon: '📤',
      description: 'Output nodes for displaying results',
      color: '#FF9800'
    });

    this.registerCategory({
      name: 'transform',
      label: 'Transform',
      icon: '🔄',
      description: 'Data transformation nodes',
      color: '#2196F3'
    });

    this.registerCategory({
      name: 'control',
      label: 'Control',
      icon: '🎛️',
      description: 'Flow control nodes',
      color: '#9C27B0'
    });

    this.registerCategory({
      name: 'file',
      label: 'File',
      icon: '📁',
      description: 'File operation nodes',
      color: '#00BCD4'
    });

    this.registerCategory({
      name: 'network',
      label: 'Network',
      icon: '🌐',
      description: 'Network operation nodes',
      color: '#FF5722'
    });
  }

  registerCategory(category: NodeCategory) {
    this.categories.set(category.name, category);
  }

  registerNode(definition: NodeDefinition) {
    this.nodes.set(definition.type, definition);
  }

  registerNodes(definitions: NodeDefinition[]) {
    definitions.forEach(def => this.registerNode(def));
  }

  getNode(type: string): NodeDefinition | undefined {
    return this.nodes.get(type);
  }

  getAllNodes(): NodeDefinition[] {
    return Array.from(this.nodes.values());
  }

  getNodesByCategory(category: string): NodeDefinition[] {
    return this.getAllNodes().filter(node => node.category === category);
  }

  getCategories(): NodeCategory[] {
    return Array.from(this.categories.values());
  }

  getNodeTypes(): NodeTypes {
    const types: NodeTypes = {};
    this.nodes.forEach((def, type) => {
      types[type] = def.component;
    });
    return types;
  }

  generateCommand(nodeType: string, data: any): string {
    const definition = this.getNode(nodeType);
    if (definition?.generateCommand) {
      return definition.generateCommand(data);
    }
    return '';
  }

  searchNodes(query: string): NodeDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllNodes().filter(node => 
      node.label.toLowerCase().includes(lowerQuery) ||
      node.description.toLowerCase().includes(lowerQuery) ||
      node.type.toLowerCase().includes(lowerQuery)
    );
  }
}

export const nodeRegistry = new NodeRegistryService();
```

### 3. コマンドノードの登録例
```typescript
// src/webview/nodeTypes/commands/registry/echoRegistry.ts
import { NodeDefinition } from '../../../types/NodeRegistry';
import { EchoNode } from '../EchoNode';

export const echoNodeDefinition: NodeDefinition = {
  type: 'echo',
  category: 'output',
  label: 'echo',
  icon: '📢',
  description: 'Output text to stdout',
  documentation: 'The echo command outputs text to standard output.',
  inputs: [
    {
      id: 'stdin',
      label: 'Input',
      type: 'stdin',
      required: false,
      description: 'Optional input stream'
    }
  ],
  outputs: [
    {
      id: 'stdout',
      label: 'Output',
      type: 'stdout',
      description: 'Text output'
    }
  ],
  options: [
    {
      name: 'text',
      flag: '',
      type: 'string',
      default: '',
      description: 'Text to output'
    },
    {
      name: 'newline',
      flag: '-n',
      type: 'boolean',
      default: true,
      description: 'Add newline at the end'
    }
  ],
  component: EchoNode,
  generateCommand: (data) => {
    let cmd = 'echo';
    if (!data.newline) cmd += ' -n';
    if (data.text) cmd += ` "${data.text}"`;
    return cmd;
  }
};
```

### 4. 自動登録システム
```typescript
// src/webview/nodeTypes/commands/registry/index.ts
import { nodeRegistry } from '../../../services/NodeRegistry';
import { echoNodeDefinition } from './echoRegistry';
import { grepNodeDefinition } from './grepRegistry';
import { lsNodeDefinition } from './lsRegistry';
import { catNodeDefinition } from './catRegistry';
import { wcNodeDefinition } from './wcRegistry';

// 基本コマンドの登録
export function registerBaseCommands() {
  nodeRegistry.registerNodes([
    echoNodeDefinition,
    grepNodeDefinition,
    lsNodeDefinition,
    catNodeDefinition,
    wcNodeDefinition,
  ]);
}

// 拡張コマンドの登録（将来的に追加）
export function registerExtendedCommands() {
  // sed, awk, cut, sort, uniq, etc.
}

// すべてのコマンドを登録
export function registerAllCommands() {
  registerBaseCommands();
  // registerExtendedCommands();
}
```

### 5. ダイナミックNodePanel
```typescript
// src/webview/components/DynamicNodePanel.tsx
import React, { useState } from 'react';
import { nodeRegistry } from '../services/NodeRegistry';

export const DynamicNodePanel: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = nodeRegistry.getCategories();
  const nodes = selectedCategory === 'all' 
    ? nodeRegistry.getAllNodes()
    : nodeRegistry.getNodesByCategory(selectedCategory);

  const filteredNodes = searchQuery 
    ? nodeRegistry.searchNodes(searchQuery)
    : nodes;

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="dynamic-node-panel">
      <div className="panel-header">
        <h3>Nodes</h3>
        <input
          type="text"
          placeholder="Search nodes..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="category-tabs">
        <button
          className={selectedCategory === 'all' ? 'active' : ''}
          onClick={() => setSelectedCategory('all')}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.name}
            className={selectedCategory === cat.name ? 'active' : ''}
            onClick={() => setSelectedCategory(cat.name)}
            title={cat.description}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div className="node-list">
        {filteredNodes.map((node) => (
          <div
            key={node.type}
            className="node-item"
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
            title={node.description}
            style={{ 
              borderLeft: `3px solid ${
                nodeRegistry.getCategories()
                  .find(c => c.name === node.category)?.color || '#999'
              }` 
            }}
          >
            <span className="node-icon">{node.icon}</span>
            <div className="node-info">
              <span className="node-label">{node.label}</span>
              <span className="node-description">{node.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 6. コマンド生成機能
```typescript
// src/webview/utils/CommandGenerator.ts
import { Node, Edge } from 'reactflow';
import { nodeRegistry } from '../services/NodeRegistry';

export class CommandGenerator {
  generateScript(nodes: Node[], edges: Edge[]): string {
    const sortedNodes = this.topologicalSort(nodes, edges);
    const commands: string[] = [];

    sortedNodes.forEach(node => {
      const command = nodeRegistry.generateCommand(node.type || '', node.data);
      if (command) {
        commands.push(command);
      }
    });

    return this.buildPipeline(commands, edges);
  }

  private topologicalSort(nodes: Node[], edges: Edge[]): Node[] {
    // トポロジカルソートの実装
    // ... (既存の実装を使用)
    return nodes;
  }

  private buildPipeline(commands: string[], edges: Edge[]): string {
    // パイプラインの構築
    return commands.join(' | ');
  }
}
```

### 7. プラグインシステム（将来の拡張）
```typescript
// src/webview/plugins/NodePlugin.ts
export interface NodePlugin {
  name: string;
  version: string;
  nodes: NodeDefinition[];
  activate(): void;
  deactivate(): void;
}

export class PluginManager {
  private plugins: Map<string, NodePlugin> = new Map();

  loadPlugin(plugin: NodePlugin) {
    this.plugins.set(plugin.name, plugin);
    plugin.activate();
    nodeRegistry.registerNodes(plugin.nodes);
  }

  unloadPlugin(name: string) {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.deactivate();
      // Remove nodes from registry
      this.plugins.delete(name);
    }
  }
}
```

### 8. スタイル
```css
/* src/webview/styles/node-registry.css */
.dynamic-node-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  padding: 10px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.search-input {
  width: 100%;
  padding: 6px;
  margin-top: 8px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  background: var(--vscode-editor-background);
  border-bottom: 1px solid var(--vscode-panel-border);
}

.category-tabs button {
  padding: 4px 8px;
  background: var(--vscode-button-secondaryBackground);
  color: var(--vscode-button-secondaryForeground);
  border: 1px solid var(--vscode-button-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.category-tabs button.active {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}

.node-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.node-description {
  font-size: 10px;
  color: var(--vscode-descriptionForeground);
  margin-top: 2px;
}
```

## 成果物
- src/webview/types/NodeRegistry.ts
- src/webview/services/NodeRegistry.ts
- src/webview/nodeTypes/commands/registry/各コマンド定義
- src/webview/components/DynamicNodePanel.tsx
- src/webview/utils/CommandGenerator.ts
- src/webview/plugins/NodePlugin.ts
- src/webview/styles/node-registry.css

## テスト方法
1. ノードが動的に登録される
2. カテゴリ別にフィルタリングできる
3. 検索機能が動作する
4. コマンドが自動生成される
5. 新しいノードを簡単に追加できる

## 完了条件
- [ ] NodeRegistryサービスが実装されている
- [ ] 基本コマンドが登録されている
- [ ] DynamicNodePanelが動作する
- [ ] コマンド生成機能が実装されている
- [ ] 拡張可能な構造になっている