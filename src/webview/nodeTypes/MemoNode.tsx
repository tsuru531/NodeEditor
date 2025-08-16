import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';

interface MemoNodeData {
  content: string;
  isEditing: boolean;
  title?: string;
}

interface MemoNodeProps {
  data: MemoNodeData;
  id: string;
  selected: boolean;
}

export const MemoNode: React.FC<MemoNodeProps> = React.memo(({ data, id, selected }) => {
  const [content, setContent] = useState(data.content || '');
  const [isEditing, setIsEditing] = useState(data.isEditing || false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [nodeSize, setNodeSize] = useState({ width: 200, height: 120 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
  }, []);

  const toggleEditMode = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
    // Ctrl+Enter で編集モード終了
    if (e.key === 'Enter' && e.ctrlKey) {
      setIsEditing(false);
    }
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (!isEditing) {
      setIsEditing(true);
    }
  }, [isEditing]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const target = e.currentTarget as HTMLDivElement;
    if (target.scrollHeight > target.clientHeight) {
      // スクロール可能な場合のみイベントを止める
      e.stopPropagation();
    }
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

  const onResize = useCallback((event: any, data: { width: number; height: number }) => {
    setNodeSize({ width: data.width, height: data.height });
  }, []);

  const onResizeEnd = useCallback((event: any, data: { width: number; height: number }) => {
    setNodeSize({ width: data.width, height: data.height });
  }, []);

  return (
    <div 
      className={`memo-node ${selected ? 'selected' : ''} ${isEditing ? 'nodrag' : ''}`}
      style={{
        width: isCollapsed ? `${nodeSize.width}px` : `${nodeSize.width}px`,
        height: isCollapsed ? '40px' : `${nodeSize.height}px`,
        minWidth: '120px',
        minHeight: isCollapsed ? '40px' : '80px',
        background: 'var(--node-background)',
        border: `2px solid ${selected ? 'var(--selection-color)' : 'var(--memo-node-color)'}`,
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        position: 'relative',
      }}
      onDoubleClick={!isCollapsed ? handleDoubleClick : undefined}
    >
      <NodeResizer
        color="transparent"
        isVisible={selected && !isCollapsed}
        minWidth={120}
        minHeight={80}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
        handleStyle={{
          opacity: 0,
          pointerEvents: 'auto',
        }}
        lineStyle={{
          opacity: 0,
        }}
      />
      {/* ヘッダー */}
      <div 
        className="memo-header"
        style={{
          padding: '6px 12px',
          background: 'var(--node-header-background)',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--node-border)',
          borderRadius: isCollapsed ? '6px' : '6px 6px 0 0',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 'bold',
            color: 'var(--memo-node-color)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <span style={{ fontSize: '12px' }}>📝</span> Memo
          </span>
          <span
            onClick={toggleCollapse}
            style={{
              fontSize: '12px',
              color: 'var(--text-color)',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '2px',
            }}
          >
            {isCollapsed ? '▶' : '▼'}
          </span>
        </div>
      </div>

      {/* コンテンツ */}
      {!isCollapsed && (
        <div 
          className="memo-content"
          style={{
            padding: '12px',
            height: `${nodeSize.height - 40}px`, // ヘッダー分を引く
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setIsEditing(false)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'transparent',
              color: 'var(--text-color)',
              fontSize: '13px',
              fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
              lineHeight: '1.4',
              boxSizing: 'border-box',
              padding: '0',
              margin: '0',
            }}
          />
        ) : (
          <div 
            tabIndex={0}
            onWheel={handleWheel}
            style={{
              fontSize: '13px',
              lineHeight: '1.4',
              color: 'var(--text-color)',
              height: '100%',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflow: 'auto',
              outline: 'none',
            }}
          >
            {content}
          </div>
        )}
        </div>
      )}

      {/* ハンドル */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: 'var(--handle-color)',
          border: '2px solid var(--handle-border)',
          right: '-8px',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: 'var(--handle-color)',
          border: '2px solid var(--handle-border)',
          left: '-8px',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      />
    </div>
  );
});