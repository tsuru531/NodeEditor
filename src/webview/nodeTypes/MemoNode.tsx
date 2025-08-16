import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';

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

export const MemoNode: React.FC<MemoNodeProps> = ({ data, id, selected }) => {
  const [content, setContent] = useState(data.content || '# メモ\n\nここにMarkdownテキストを入力してください。');
  const [isEditing, setIsEditing] = useState(data.isEditing || false);
  const [title, setTitle] = useState(data.title || 'メモ');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    // タイトルを最初の行から抽出
    const firstLine = value.split('\n')[0];
    if (firstLine.startsWith('#')) {
      setTitle(firstLine.replace(/^#+\s*/, ''));
    }
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

  // 簡易Markdownレンダリング（markdown-itがない場合の代替）
  const renderMarkdown = useCallback((text: string) => {
    return text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      .replace(/\n/gim, '<br>');
  }, []);

  return (
    <div 
      className={`memo-node ${selected ? 'selected' : ''}`}
      style={{
        minWidth: '200px',
        maxWidth: '400px',
        background: 'var(--node-background)',
        border: `2px solid ${selected ? 'var(--selection-color)' : 'var(--node-border)'}`,
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}
    >
      {/* ヘッダー */}
      <div 
        className="memo-header"
        style={{
          padding: '8px 12px',
          background: 'var(--node-header-background)',
          borderBottom: '1px solid var(--node-border)',
          borderRadius: '6px 6px 0 0',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        onClick={toggleEditMode}
      >
        <span style={{ 
          fontSize: '12px', 
          fontWeight: 'bold',
          color: 'var(--text-color)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          📝 {title}
        </span>
        <span style={{ 
          fontSize: '10px', 
          color: 'var(--text-muted)',
        }}>
          {isEditing ? '編集中' : 'クリックで編集'}
        </span>
      </div>

      {/* コンテンツ */}
      <div 
        className="memo-content"
        style={{
          padding: '12px',
          minHeight: '100px',
          maxHeight: '300px',
          overflow: 'auto',
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
              height: '150px',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              background: 'transparent',
              color: 'var(--text-color)',
              fontSize: '13px',
              fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
              lineHeight: '1.4',
            }}
            placeholder="Markdownでメモを入力..."
          />
        ) : (
          <div 
            style={{
              fontSize: '13px',
              lineHeight: '1.5',
              color: 'var(--text-color)',
              minHeight: '60px',
            }}
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(content)
            }}
          />
        )}
      </div>

      {/* ハンドル */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: 'var(--handle-color)',
          border: '2px solid var(--handle-border)',
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: 'var(--handle-color)',
          border: '2px solid var(--handle-border)',
        }}
      />
    </div>
  );
};