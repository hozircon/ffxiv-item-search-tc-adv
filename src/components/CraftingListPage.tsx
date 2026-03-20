// Crafting materials list page
// Layout: [Item list] | [Tier 3 (High)] | [Tier 2 (Mid)] | [Tier 1 (Raw)] + Crystals
import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCraftingList } from '../contexts/CraftingListContext';
import { useCraftingListData, type AggregatedMaterial } from '../hooks/useCraftingListData';
import { getItemById } from '../services/searchService';
import { getItemIconUrl } from '../services/xivapiService';
import { CopyButton } from './CopyButton';

// ─── Sub-components ─────────────────────────────────────────────────────────

function ItemIcon({ iconId, name, size = 'w-8 h-8' }: { iconId: number; name: string; size?: string }) {
  return (
    <div className={`flex-shrink-0 ${size} bg-[var(--ffxiv-bg-tertiary)] rounded overflow-hidden`}>
      <img
        src={getItemIconUrl(iconId)}
        alt={name}
        className="w-full h-full object-contain"
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).src = getItemIconUrl(0); }}
      />
    </div>
  );
}

interface RecipeSelectorProps {
  material: AggregatedMaterial;
  onRecipeChange: (itemId: number, recipeIndex: number) => void;
}

function RecipeSelector({ material, onRecipeChange }: RecipeSelectorProps) {
  if (material.recipes.length <= 1) return null;
  return (
    <select
      value={material.selectedRecipeIndex}
      onChange={e => onRecipeChange(material.item.id, Number(e.target.value))}
      onClick={e => e.stopPropagation()}
      className="ml-1 text-xs bg-[var(--ffxiv-bg-tertiary)] border border-[var(--ffxiv-border)] text-[var(--ffxiv-muted)] rounded px-1 py-0.5 cursor-pointer hover:border-[var(--ffxiv-accent)] transition-colors"
      title="選擇製作職業"
    >
      {material.recipes.map((r, i) => (
        <option key={r.id} value={i}>{r.craftTypeName}</option>
      ))}
    </select>
  );
}

interface MaterialRowProps {
  material: AggregatedMaterial;
  onRecipeChange: (itemId: number, recipeIndex: number) => void;
  onNavigate?: (itemId: number) => void;
}

function MaterialRow({ material, onRecipeChange, onNavigate }: MaterialRowProps) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-[var(--ffxiv-bg-tertiary)]/60 transition-colors">
      <ItemIcon iconId={material.item.icon} name={material.item.name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-0.5">
          <button
            className="text-sm text-[var(--ffxiv-text)] hover:text-[var(--ffxiv-accent)] transition-colors text-left truncate flex-1"
            onClick={() => onNavigate?.(material.item.id)}
            title={material.item.name}
          >
            {material.item.name}
          </button>
          <CopyButton text={material.item.name} />
        </div>
        <RecipeSelector material={material} onRecipeChange={onRecipeChange} />
      </div>
      <span className="flex-shrink-0 text-sm font-medium text-[var(--ffxiv-highlight)]">
        ×{material.totalQuantity}
      </span>
    </div>
  );
}

interface TierColumnProps {
  title: string;
  subtitle: string;
  materials: AggregatedMaterial[];
  bgColor: string;
  borderColor: string;
  titleColor: string;
  onRecipeChange: (itemId: number, recipeIndex: number) => void;
  onNavigate?: (itemId: number) => void;
}

function TierColumn({ title, subtitle, materials, bgColor, borderColor, titleColor, onRecipeChange, onNavigate }: TierColumnProps) {
  return (
    <div className={`flex-1 min-w-0 rounded-lg border ${borderColor} ${bgColor} flex flex-col`}>
      <div className={`px-3 py-2 border-b ${borderColor}`}>
        <div className={`text-sm font-semibold ${titleColor}`}>{title}</div>
        <div className="text-xs text-[var(--ffxiv-muted)]">{subtitle}</div>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[60vh] p-1">
        {materials.length === 0 ? (
          <div className="text-xs text-[var(--ffxiv-muted)] text-center py-4">－</div>
        ) : (
          materials.map(m => (
            <MaterialRow
              key={m.item.id}
              material={m}
              onRecipeChange={onRecipeChange}
              onNavigate={onNavigate}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function CraftingListPage() {
  const { list, removeItem, clearList, updateQuantity } = useCraftingList();
  const [selectedRecipes, setSelectedRecipes] = useState<Record<number, number>>({});

  const handleRecipeChange = useCallback((itemId: number, recipeIndex: number) => {
    setSelectedRecipes(prev => ({ ...prev, [itemId]: recipeIndex }));
  }, []);

  const { tier3Materials, tier2Materials, tier1Materials, crystals } = useCraftingListData(list, selectedRecipes);

  const handleQuantityChange = useCallback((itemId: number, raw: string) => {
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 1) updateQuantity(itemId, n);
  }, [updateQuantity]);

  const isEmpty = list.length === 0;
  const totalMaterialTypes = tier3Materials.length + tier2Materials.length + tier1Materials.length + crystals.length;

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ffxiv-text)]">素材統計列表</h1>
          <p className="text-sm text-[var(--ffxiv-muted)] mt-1">
            加入可製作道具後，自動計算所需素材總量
          </p>
        </div>
        {!isEmpty && (
          <button
            onClick={clearList}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 border border-red-400/40 rounded-lg hover:bg-red-400/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            清空列表
          </button>
        )}
      </div>

      {isEmpty ? (
        /* Empty state */
        <div className="text-center py-20">
          <svg className="w-16 h-16 text-[var(--ffxiv-muted)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-[var(--ffxiv-muted)] mb-2">列表是空的</p>
          <p className="text-sm text-[var(--ffxiv-muted)]">
            在搜尋結果中點擊「加入列表」按鈕來新增可製作道具
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-[var(--ffxiv-accent)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
          >
            前往搜尋
          </Link>
        </div>
      ) : (
        <div className="flex gap-4 items-start">
          {/* ── Column 0: Item list ── */}
          <div className="w-56 flex-shrink-0 rounded-lg border border-[var(--ffxiv-border)] bg-[var(--ffxiv-bg-secondary)]">
            <div className="px-3 py-2 border-b border-[var(--ffxiv-border)]">
              <div className="text-sm font-semibold text-[var(--ffxiv-text)]">製作目標</div>
              <div className="text-xs text-[var(--ffxiv-muted)]">{list.length} 件道具</div>
            </div>
            <div className="p-1 overflow-y-auto max-h-[60vh]">
              {list.map(listItem => {
                const item = getItemById(listItem.itemId);
                if (!item) return null;
                return (
                  <div key={listItem.itemId} className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-[var(--ffxiv-bg-tertiary)]/60 transition-colors group">
                    <ItemIcon iconId={item.icon} name={item.name} size="w-7 h-7" />
                    <span className="flex-1 min-w-0 text-xs text-[var(--ffxiv-text)] truncate" title={item.name}>
                      {item.name}
                    </span>
                    {/* Quantity controls */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => updateQuantity(listItem.itemId, listItem.quantity - 1)}
                        className="w-5 h-5 flex items-center justify-center text-[var(--ffxiv-muted)] hover:text-[var(--ffxiv-text)] bg-[var(--ffxiv-bg-tertiary)] rounded text-xs"
                      >−</button>
                      <input
                        type="number"
                        min={1}
                        value={listItem.quantity}
                        onChange={e => handleQuantityChange(listItem.itemId, e.target.value)}
                        className="w-8 text-center text-xs bg-[var(--ffxiv-bg-tertiary)] border border-[var(--ffxiv-border)] rounded text-[var(--ffxiv-text)] py-0.5"
                      />
                      <button
                        onClick={() => updateQuantity(listItem.itemId, listItem.quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center text-[var(--ffxiv-muted)] hover:text-[var(--ffxiv-text)] bg-[var(--ffxiv-bg-tertiary)] rounded text-xs"
                      >+</button>
                    </div>
                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(listItem.itemId)}
                      className="w-5 h-5 flex items-center justify-center text-[var(--ffxiv-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded"
                      title="從列表移除"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Columns 1-3: Material tiers ── */}
          {totalMaterialTypes === 0 ? (
            <div className="flex-1 flex items-center justify-center py-20 text-[var(--ffxiv-muted)] text-sm">
              列表中的道具均無製作配方
            </div>
          ) : (
            <>
              <TierColumn
                title="第三階材料"
                subtitle="高級・可進一步製作"
                materials={tier3Materials}
                bgColor="bg-blue-950/20"
                borderColor="border-blue-700/40"
                titleColor="text-blue-300"
                onRecipeChange={handleRecipeChange}
              />
              <TierColumn
                title="第二階材料"
                subtitle="中級・由原料直接製成"
                materials={tier2Materials}
                bgColor="bg-sky-950/20"
                borderColor="border-sky-700/40"
                titleColor="text-sky-300"
                onRecipeChange={handleRecipeChange}
              />
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <TierColumn
                  title="第一階材料"
                  subtitle="原料・直接採集/購買"
                  materials={tier1Materials}
                  bgColor="bg-green-950/20"
                  borderColor="border-green-700/40"
                  titleColor="text-green-300"
                  onRecipeChange={handleRecipeChange}
                />
                {crystals.length > 0 && (
                  <TierColumn
                    title="晶體"
                    subtitle="製作用晶體/叢晶/巨晶"
                    materials={crystals}
                    bgColor="bg-purple-950/20"
                    borderColor="border-purple-700/40"
                    titleColor="text-purple-300"
                    onRecipeChange={handleRecipeChange}
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
