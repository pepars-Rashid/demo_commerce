import { useState, useCallback, useMemo, useEffect } from "react";

interface UseTableSelectionOptions<T> {
  items: readonly T[];
  getId: (item: T) => string | number;
  autoClearOnChange?: boolean;
}

export function useTableSelection<T>(
  options: UseTableSelectionOptions<T>
) {
  const { items, getId, autoClearOnChange = true } = options;
  
  // Single source of truth - just store IDs
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Derived state
  const selectedCount = selectedIds.size;
  const isAllSelected = items.length > 0 && 
    items.every(item => selectedIds.has(getId(item)));

  // Toggle single item
  const toggleSelect = useCallback((id: string | number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Toggle all
  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      const allSelected = items.length > 0 && 
        items.every(item => prev.has(getId(item)));
      
      if (allSelected) return new Set();
      return new Set(items.map(item => getId(item)));
    });
  }, [items, getId]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Get selected items (if needed)
  const getSelectedItems = useCallback(() => {
    return items.filter(item => selectedIds.has(getId(item)));
  }, [items, selectedIds, getId]);

  // Auto-clear on page change
  useEffect(() => {
    if (autoClearOnChange) {
      clearSelection();
    }
  }, [items, autoClearOnChange, clearSelection]);

  // Cleanup on unmount
  useEffect(() => {
    return clearSelection;
  }, [clearSelection]);

  return {
    selectedIds,
    selectedCount,
    isAllSelected,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    getSelectedItems,
    isSelected: (id: string | number) => selectedIds.has(id),
  };
}