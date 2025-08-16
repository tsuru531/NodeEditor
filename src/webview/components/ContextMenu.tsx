import React, { useCallback } from 'react';

interface ContextMenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onAddNode: (nodeType: string) => void;
  onDeleteSelected: () => void;
  onCopySelected: () => void;
  onSelectAll: () => void;
  hasSelectedNodes: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isVisible,
  position,
  onClose,
  onAddNode,
  onDeleteSelected,
  onCopySelected,
  onSelectAll,
  hasSelectedNodes,
}) => {
  const handleMenuClick = useCallback((action: () => void) => {
    action();
    onClose();
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'transparent',
          zIndex: 998,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed',
          top: position.y,
          left: position.x,
          background: 'var(--vscode-menu-background)',
          border: '1px solid var(--vscode-menu-border)',
          borderRadius: '4px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          zIndex: 999,
          minWidth: '160px',
          padding: '4px 0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ノード追加メニュー */}
        <div style={{ padding: '4px 0', borderBottom: '1px solid var(--vscode-menu-separatorBackground)' }}>
          <div style={{ padding: '2px 12px', fontSize: '11px', color: 'var(--vscode-descriptionForeground)', fontWeight: 'bold' }}>
            ノードを追加
          </div>
          <MenuItem onClick={() => handleMenuClick(() => onAddNode('memo'))}>
            📝 メモノード
          </MenuItem>
          <MenuItem onClick={() => handleMenuClick(() => onAddNode('function'))}>
            ⚡ 関数ノード（旧）
          </MenuItem>
          <MenuItem onClick={() => handleMenuClick(() => onAddNode('functionDefinition'))}>
            🔧 関数定義ノード
          </MenuItem>
          <MenuItem onClick={() => handleMenuClick(() => onAddNode('functionCall'))}>
            ⚡ 関数呼び出しノード
          </MenuItem>
          <MenuItem onClick={() => handleMenuClick(() => onAddNode('file'))}>
            📁 ファイルノード
          </MenuItem>
          <MenuItem onClick={() => handleMenuClick(() => onAddNode('connector'))}>
            🔗 コネクタノード
          </MenuItem>
        </div>

        {/* 選択・編集メニュー */}
        <div style={{ padding: '4px 0' }}>
          <MenuItem onClick={() => handleMenuClick(onSelectAll)}>
            全選択 (Ctrl+A)
          </MenuItem>
          {hasSelectedNodes && (
            <>
              <MenuItem onClick={() => handleMenuClick(onCopySelected)}>
                コピー (Ctrl+C)
              </MenuItem>
              <MenuItem onClick={() => handleMenuClick(onDeleteSelected)} danger>
                削除 (Delete)
              </MenuItem>
            </>
          )}
        </div>
      </div>
    </>
  );
};

interface MenuItemProps {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ children, onClick, danger = false }) => (
  <div
    style={{
      padding: '6px 12px',
      fontSize: '12px',
      color: danger ? 'var(--vscode-errorForeground)' : 'var(--vscode-menu-foreground)',
      cursor: 'pointer',
      background: 'transparent',
      transition: 'background-color 0.1s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'var(--vscode-menu-selectionBackground)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'transparent';
    }}
    onClick={onClick}
  >
    {children}
  </div>
);