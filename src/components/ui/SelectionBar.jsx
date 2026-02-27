import React from 'react';
import { X, CheckSquare, Square, Trash2, MoreHorizontal } from 'lucide-react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function SelectionBar({
  count,
  onCancel,
  onSelectAll,
  isAllSelected,
  actions = [], // Array of objects: { label, icon, onClick, variant: 'danger' | 'primary' }
  className
}) {
  if (count === 0) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[150] w-full px-4 flex items-center justify-between",
        "bg-blue-600 text-white shadow-lg",
        className
      )}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'calc(60px + env(safe-area-inset-top, 0px))'
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors active:scale-95"
        >
          <X className="w-6 h-6" />
        </button>
        <span className="text-lg font-semibold">{count} Selected</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onSelectAll}
          className="p-2 rounded-xl hover:bg-white/10 transition-colors active:scale-95 flex items-center gap-2"
        >
          {isAllSelected ? (
            <CheckSquare className="w-6 h-6" />
          ) : (
            <Square className="w-6 h-6" />
          )}
          <span className="hidden sm:inline text-sm font-medium">
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </span>
        </button>

        <div className="h-6 w-px bg-white/20 mx-2" />

        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            title={action.label}
            className={cn(
              "p-2 rounded-xl hover:bg-white/10 transition-colors active:scale-95",
              action.variant === 'danger' && "text-red-200 hover:bg-red-500/20"
            )}
          >
            {action.icon || <span className="text-sm font-medium">{action.label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
