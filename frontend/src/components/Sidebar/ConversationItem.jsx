import React, { memo } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import './sidebar.css';

const ConversationItem = memo(function ConversationItem({
  id,
  title,
  isActive,
  onClick,
  onRename,
  onDelete
}) {
  return (
    <div
      className={`conversation-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <span className="conversation-item__title">{title}</span>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="conversation-item__menu-trigger"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical size={16} />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content className="conversation-item__menu-content">
            <DropdownMenu.Item
              className="conversation-item__menu-item"
              onClick={(e) => {
                e.stopPropagation();
                onRename?.(id);
              }}
            >
              <Pencil size={14} />
              <span>Rename</span>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="conversation-item__menu-separator" />

            <DropdownMenu.Item
              className="conversation-item__menu-item destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(id);
              }}
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
});

export default ConversationItem;
