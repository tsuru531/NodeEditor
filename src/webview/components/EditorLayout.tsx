import React, { useState } from 'react';
import { Node, Edge } from 'reactflow';
import { NodeEditorWithProvider } from './NodeEditor';
import { NodePanel } from './NodePanel';
import { PropertiesPanel } from './PropertiesPanel';

export const EditorLayout: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const handleNodeUpdate = (nodeId: string, data: any) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === nodeId ? { ...node, data } : node
      )
    );
  };

  return (
    <div className="editor-layout">
      <div className="sidebar-left">
        <NodePanel />
      </div>
      <div className="editor-main">
        <NodeEditorWithProvider
          initialNodes={nodes}
          initialEdges={edges}
          onNodeSelect={setSelectedNode}
          onNodesChange={setNodes}
          onEdgesChange={setEdges}
        />
      </div>
      <div className="sidebar-right">
        <PropertiesPanel 
          node={selectedNode} 
          onNodeUpdate={handleNodeUpdate}
        />
      </div>
    </div>
  );
};