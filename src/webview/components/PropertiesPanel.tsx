import React from 'react';
import { Node } from 'reactflow';

interface PropertiesPanelProps {
  node: Node | null;
  onNodeUpdate?: (nodeId: string, data: any) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ node, onNodeUpdate }) => {
  if (!node) {
    return (
      <div className="properties-panel">
        <h3>Properties</h3>
        <div className="properties-empty">
          <p>Select a node to view its properties</p>
        </div>
      </div>
    );
  }

  return (
    <div className="properties-panel">
      <h3>Properties</h3>
      <div className="properties-content">
        <div className="property-group">
          <label>Node ID:</label>
          <input type="text" value={node.id} readOnly />
        </div>
        <div className="property-group">
          <label>Type:</label>
          <input type="text" value={node.type || 'default'} readOnly />
        </div>
        <div className="property-group">
          <label>Position:</label>
          <div className="position-inputs">
            <input 
              type="number" 
              value={Math.round(node.position.x)} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (onNodeUpdate) {
                  onNodeUpdate(node.id, {
                    ...node.data,
                    position: { x: parseInt(e.target.value), y: node.position.y }
                  });
                }
              }}
              placeholder="X"
            />
            <input 
              type="number" 
              value={Math.round(node.position.y)} 
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (onNodeUpdate) {
                  onNodeUpdate(node.id, {
                    ...node.data,
                    position: { x: node.position.x, y: parseInt(e.target.value) }
                  });
                }
              }}
              placeholder="Y"
            />
          </div>
        </div>
        {node.data && Object.keys(node.data).length > 0 && (
          <div className="property-group">
            <label>Data:</label>
            <pre>{JSON.stringify(node.data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};