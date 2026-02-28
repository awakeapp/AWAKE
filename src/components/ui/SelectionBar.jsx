import { X, CheckSquare, Square, Trash2, MoreHorizontal } from 'lucide-react';
import ActionButton from '../atoms/ActionButton';
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
        <ActionButton
          variant="exit"
          onClick={onCancel}
          className="p-2 -ml-2 bg-transparent text-white hover:bg-white/10"
          size="sm"
        />
        <span className="text-lg font-semibold">{count} Selected</span>
      </div>

      <div className="flex items-center gap-1">
        <ActionButton
          variant="ghost"
          onClick={onSelectAll}
          label={isAllSelected ? 'Deselect All' : 'Select All'}
          iconOnly={false}
          className="bg-transparent text-white hover:bg-white/10"
          size="sm"
        >
          {isAllSelected ? (
            <CheckSquare className="w-5 h-5 mr-2" />
          ) : (
            <Square className="w-5 h-5 mr-2" />
          )}
          <span className="hidden sm:inline text-sm font-medium">
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </span>
        </ActionButton>

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
