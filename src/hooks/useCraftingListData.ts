// Hook to calculate multi-tier aggregated crafting materials from the crafting list
// Key design: aggregate BEFORE computing next tier to avoid resultAmount double-counting
import { useMemo } from 'react';
import type { Item, Recipe } from '../types';
import { getItemById } from '../services/searchService';
import { getRecipesForItem } from './useItemData';
import type { CraftingListItem } from '../contexts/CraftingListContext';

// Crystal item IDs (2-19)
export const CRYSTAL_IDS = new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);

/** A single entry in an aggregated tier map: itemId → quantity needed */
type TierMap = Map<number, number>;

export type MaterialTier = 'tier3' | 'tier2' | 'tier1' | 'crystal';

export interface AggregatedMaterial {
  item: Item;
  totalQuantity: number;
  tier: MaterialTier;
  /** All available recipes for this item (for the recipe selector) */
  recipes: Recipe[];
  /** Which recipe index is currently selected (controlled externally) */
  selectedRecipeIndex: number;
}

/** Determine the tier of an item given the selectedRecipes state */
function getItemTier(
  itemId: number,
  selectedRecipes: Record<number, number>,
  depth: number,
  visited: Set<number>
): MaterialTier {
  if (CRYSTAL_IDS.has(itemId)) return 'crystal';
  const recipes = getRecipesForItem(itemId);
  if (recipes.length === 0) return 'tier1';
  if (depth >= 3 || visited.has(itemId)) return 'tier1'; // safety

  const recipeIdx = selectedRecipes[itemId] ?? 0;
  const recipe = recipes[recipeIdx] ?? recipes[0];

  // Check if any ingredient is itself craftable (non-crystal)
  const hasDeepIngredient = recipe.ingredients.some(ing => {
    if (CRYSTAL_IDS.has(ing.itemId)) return false;
    const subRecipes = getRecipesForItem(ing.itemId);
    return subRecipes.length > 0;
  });

  if (hasDeepIngredient) return 'tier3';
  return 'tier2';
}

/**
 * Given a map of { itemId → quantityNeeded } for craftable items at a given tier,
 * expand them one level down using selectedRecipes, returning the ingredient map.
 * Correctly handles resultAmount by using ceil(qty / resultAmount).
 */
function expandOneTier(
  tierMap: TierMap,
  selectedRecipes: Record<number, number>
): { ingredients: TierMap; unresolved: TierMap } {
  const ingredients: TierMap = new Map();
  const unresolved: TierMap = new Map(); // items with no recipe

  for (const [itemId, quantity] of tierMap) {
    const recipes = getRecipesForItem(itemId);
    if (recipes.length === 0) {
      // No recipe — goes to unresolved (will end up as tier1/crystal)
      unresolved.set(itemId, (unresolved.get(itemId) ?? 0) + quantity);
      continue;
    }
    const recipeIdx = selectedRecipes[itemId] ?? 0;
    const recipe = recipes[recipeIdx] ?? recipes[0];
    const resultAmount = recipe.resultAmount ?? 1;
    const craftsNeeded = Math.ceil(quantity / resultAmount);

    for (const ing of recipe.ingredients) {
      ingredients.set(ing.itemId, (ingredients.get(ing.itemId) ?? 0) + ing.amount * craftsNeeded);
    }
  }

  return { ingredients, unresolved };
}

export interface CraftingListData {
  tier3Materials: AggregatedMaterial[];   // High-level craftable (has craftable sub-materials)
  tier2Materials: AggregatedMaterial[];   // Mid-level craftable (all sub-materials are raw)
  tier1Materials: AggregatedMaterial[];   // Raw materials (no recipe)
  crystals: AggregatedMaterial[];         // Crystals
}

/**
 * Main calculation hook.
 *
 * Flow (correct order to avoid resultAmount double-counting):
 *   1. Collect direct ingredients of each list item × listItem.quantity → initial map
 *   2. Classify each ingredient: tier3, tier2, tier1, crystal
 *   3. Expand tier3 ingredients one level → adds to tier2/tier1/crystal pool
 *   4. Expand tier2 ingredients one level → adds to tier1/crystal pool
 *      (Must aggregate FIRST, then expand)
 */
export function useCraftingListData(
  list: CraftingListItem[],
  selectedRecipes: Record<number, number>
): CraftingListData {
  return useMemo(() => {
    if (list.length === 0) {
      return { tier3Materials: [], tier2Materials: [], tier1Materials: [], crystals: [] };
    }

    // ─── Step 1: Collect all direct-ingredient quantities (Tier 3 level) ───
    // We treat the list items themselves as "depth 0" and their direct materials as depth 1.
    // Aggregate by itemId before expanding to avoid resultAmount issues.
    const directIngMap: TierMap = new Map();

    for (const listItem of list) {
      const recipes = getRecipesForItem(listItem.itemId);
      if (recipes.length === 0) continue; // item not craftable — skip
      const recipeIdx = selectedRecipes[listItem.itemId] ?? 0;
      const recipe = recipes[recipeIdx] ?? recipes[0];
      const resultAmount = recipe.resultAmount ?? 1;
      const craftsNeeded = Math.ceil(listItem.quantity / resultAmount);

      for (const ing of recipe.ingredients) {
        directIngMap.set(ing.itemId, (directIngMap.get(ing.itemId) ?? 0) + ing.amount * craftsNeeded);
      }
    }

    // ─── Step 2: Classify direct ingredients into tiers ───
    const tier3Map: TierMap = new Map();
    const tier2Map: TierMap = new Map();
    const tier1Map: TierMap = new Map();
    const crystalMap: TierMap = new Map();

    for (const [itemId, qty] of directIngMap) {
      const tier = getItemTier(itemId, selectedRecipes, 0, new Set());
      if (tier === 'tier3') tier3Map.set(itemId, qty);
      else if (tier === 'tier2') tier2Map.set(itemId, qty);
      else if (tier === 'crystal') crystalMap.set(itemId, (crystalMap.get(itemId) ?? 0) + qty);
      else tier1Map.set(itemId, qty);
    }

    // ─── Step 3: Expand tier3 → adds ingredients into tier2/tier1/crystal pools ───
    // Aggregate tier3 first (already done above), then expand.
    const { ingredients: tier3Expanded, unresolved: tier3Unresolved } = expandOneTier(tier3Map, selectedRecipes);

    for (const [itemId, qty] of tier3Unresolved) {
      tier1Map.set(itemId, (tier1Map.get(itemId) ?? 0) + qty);
    }

    // Classify tier3's expanded ingredients
    for (const [itemId, qty] of tier3Expanded) {
      const tier = getItemTier(itemId, selectedRecipes, 1, new Set());
      if (tier === 'tier2') tier2Map.set(itemId, (tier2Map.get(itemId) ?? 0) + qty);
      else if (tier === 'crystal') crystalMap.set(itemId, (crystalMap.get(itemId) ?? 0) + qty);
      else tier1Map.set(itemId, (tier1Map.get(itemId) ?? 0) + qty);
    }

    // ─── Step 4: Expand tier2 (aggregated) → tier1/crystal ───
    const { ingredients: tier2Expanded, unresolved: tier2Unresolved } = expandOneTier(tier2Map, selectedRecipes);

    for (const [itemId, qty] of tier2Unresolved) {
      tier1Map.set(itemId, (tier1Map.get(itemId) ?? 0) + qty);
    }

    for (const [itemId, qty] of tier2Expanded) {
      if (CRYSTAL_IDS.has(itemId)) {
        crystalMap.set(itemId, (crystalMap.get(itemId) ?? 0) + qty);
      } else {
        tier1Map.set(itemId, (tier1Map.get(itemId) ?? 0) + qty);
      }
    }

    // ─── Step 5: Convert maps to AggregatedMaterial arrays ───
    function toMaterials(map: TierMap, tier: MaterialTier): AggregatedMaterial[] {
      const result: AggregatedMaterial[] = [];
      for (const [itemId, totalQuantity] of map) {
        const item = getItemById(itemId);
        if (!item) continue;
        const recipes = getRecipesForItem(itemId);
        result.push({
          item,
          totalQuantity,
          tier,
          recipes,
          selectedRecipeIndex: selectedRecipes[itemId] ?? 0,
        });
      }
      // Sort by item name for consistent display
      return result.sort((a, b) => a.item.name.localeCompare(b.item.name, 'zh-TW'));
    }

    return {
      tier3Materials: toMaterials(tier3Map, 'tier3'),
      tier2Materials: toMaterials(tier2Map, 'tier2'),
      tier1Materials: toMaterials(tier1Map, 'tier1'),
      crystals: toMaterials(crystalMap, 'crystal'),
    };
  }, [list, selectedRecipes]);
}
