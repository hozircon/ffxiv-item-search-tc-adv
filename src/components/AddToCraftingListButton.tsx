// Button to add/remove an item from the crafting materials list
import { useCraftingList } from '../contexts/CraftingListContext';

interface AddToCraftingListButtonProps {
  itemId: number;
  variant?: 'icon' | 'small' | 'button';
  className?: string;
}

export function AddToCraftingListButton({ itemId, variant = 'icon', className = '' }: AddToCraftingListButtonProps) {
  const { isInList, toggleItem } = useCraftingList();
  const inList = isInList(itemId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(itemId);
  };

  // Shopping cart icon SVG
  const cartIcon = (size: string) => (
    <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={`p-1 rounded transition-colors ${
          inList
            ? 'text-emerald-400 bg-emerald-400/20 hover:bg-emerald-400/30'
            : 'text-[var(--ffxiv-muted)] hover:text-emerald-400 hover:bg-emerald-400/10'
        } ${className}`}
        title={inList ? '從素材列表移除' : '加入素材列表'}
      >
        {cartIcon('w-4 h-4')}
      </button>
    );
  }

  if (variant === 'small') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
          inList
            ? 'text-emerald-400 bg-emerald-400/20 hover:bg-emerald-400/30'
            : 'text-[var(--ffxiv-muted)] hover:text-emerald-400 hover:bg-emerald-400/10'
        } ${className}`}
        title={inList ? '從素材列表移除' : '加入素材列表'}
      >
        {cartIcon('w-3.5 h-3.5')}
        {inList ? '已加入' : '加入列表'}
      </button>
    );
  }

  // Full button variant
  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        inList
          ? 'text-emerald-400 bg-emerald-400/20 hover:bg-emerald-400/30 border border-emerald-400'
          : 'text-[var(--ffxiv-muted)] hover:text-emerald-400 hover:bg-emerald-400/10 border border-[var(--ffxiv-border)]'
      } ${className}`}
    >
      {cartIcon('w-4 h-4')}
      {inList ? '已加入素材列表' : '加入素材列表'}
    </button>
  );
}
