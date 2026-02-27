import { useState, useCallback } from 'react';

export const useSelection = (allIds = []) => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleSelection = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      
      // Auto-exit if nothing selected
      if (next.size === 0) {
        setIsSelectionMode(false);
      }
      
      return next;
    });
  }, []);

  const enterSelectionMode = useCallback((initialId) => {
    setIsSelectionMode(true);
    if (initialId) {
      setSelectedIds(new Set([initialId]));
    }
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === allIds.length) {
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedIds(new Set(allIds));
      setIsSelectionMode(true);
    }
  }, [allIds, selectedIds.size]);

  const isSelected = useCallback((id) => selectedIds.has(id), [selectedIds]);

  return {
    isSelectionMode,
    setIsSelectionMode,
    selectedIds: Array.from(selectedIds),
    toggleSelection,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelectAll,
    isSelected,
    count: selectedIds.size,
    isAllSelected: allIds.length > 0 && selectedIds.size === allIds.length,
  };
};
