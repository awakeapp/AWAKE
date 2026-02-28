import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Trash2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ActionButton from '../atoms/ActionButton';
import Pressable from '../atoms/Pressable';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function ItemMenu({
  onEdit,
  onDelete,
  onView,
  extraActions = [], // { label, icon, onClick, variant }
  className,
  iconClassName,
  onOpenChange // NEW: callback to lift state up
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Sync state upward when it changes
  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const actions = [
    onView && { label: 'View', icon: Eye, onClick: onView },
    onEdit && { label: 'Edit', icon: Edit2, onClick: onEdit },
    ...extraActions,
    onDelete && { label: 'Delete', icon: Trash2, onClick: onDelete, variant: 'danger' },
  ].filter(Boolean);

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <ActionButton
        variant="ghost"
        onClick={toggleMenu}
        className={cn(
          "p-2 rounded-xl text-slate-400",
          iconClassName
        )}
      >
        <MoreVertical className="w-5 h-5" />
      </ActionButton>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-[200] overflow-hidden"
          >
            <div className="p-1.5 flex flex-col">
              {actions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <Pressable
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsOpen(false);
                      action.onClick();
                    }}
                    scaleDown={0.98}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 w-full text-left text-sm font-semibold rounded-xl transition-colors",
                      action.variant === 'danger'
                        ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{action.label}</span>
                  </Pressable>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
