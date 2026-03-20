// Crafting material list context - tracks items to calculate total material requirements
import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';

const STORAGE_KEY = 'ffxiv-crafting-list';

export interface CraftingListItem {
  itemId: number;
  quantity: number;
  addedAt: number;
}

function loadList(): CraftingListItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return [];
}

function saveList(list: CraftingListItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

interface CraftingListContextValue {
  list: CraftingListItem[];
  addItem: (itemId: number) => void;
  removeItem: (itemId: number) => void;
  clearList: () => void;
  isInList: (itemId: number) => boolean;
  toggleItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  itemCount: number;
}

const CraftingListContext = createContext<CraftingListContextValue | null>(null);

export function CraftingListProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<CraftingListItem[]>(loadList);

  useEffect(() => {
    saveList(list);
  }, [list]);

  const addItem = useCallback((itemId: number) => {
    setList(prev => {
      if (prev.find(i => i.itemId === itemId)) return prev;
      return [...prev, { itemId, quantity: 1, addedAt: Date.now() }];
    });
  }, []);

  const removeItem = useCallback((itemId: number) => {
    setList(prev => prev.filter(i => i.itemId !== itemId));
  }, []);

  const clearList = useCallback(() => setList([]), []);

  const isInList = useCallback((itemId: number): boolean => {
    return list.some(i => i.itemId === itemId);
  }, [list]);

  const toggleItem = useCallback((itemId: number) => {
    setList(prev => {
      if (prev.find(i => i.itemId === itemId)) {
        return prev.filter(i => i.itemId !== itemId);
      }
      return [...prev, { itemId, quantity: 1, addedAt: Date.now() }];
    });
  }, []);

  const updateQuantity = useCallback((itemId: number, quantity: number) => {
    setList(prev => prev.map(i =>
      i.itemId === itemId ? { ...i, quantity: Math.max(1, quantity) } : i
    ));
  }, []);

  const itemCount = useMemo(() => list.length, [list]);

  return (
    <CraftingListContext.Provider value={{
      list, addItem, removeItem, clearList, isInList,
      toggleItem, updateQuantity, itemCount,
    }}>
      {children}
    </CraftingListContext.Provider>
  );
}

export function useCraftingList(): CraftingListContextValue {
  const ctx = useContext(CraftingListContext);
  if (!ctx) throw new Error('useCraftingList must be used within CraftingListProvider');
  return ctx;
}
