import { useState, useEffect, useCallback } from 'react';
import { format, addDays } from 'date-fns';

/**
 * Hook to manage meal batches with automatic syncing based on plan
 */
export function useMealBatches(recipes, plan, currentWeekStart) {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [removedRecipeIds, setRemovedRecipeIds] = useState([]);

  /**
   * Synchronize meal batches with current week's plan
   */
  useEffect(() => {
    if (!recipes.length) return;

    const startStr = format(currentWeekStart, 'yyyy-MM-dd');
    const endStr = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');

    const currentWeekSlots = plan.filter(
      (p) => p.plan_date >= startStr && p.plan_date <= endStr
    );

    const recipeIdsInWeek = [
      ...new Set(currentWeekSlots.map((p) => p.recipe_id)),
    ].filter(Boolean);

    setBatches((prevBatches) => {
      const newBatches = [];

      recipeIdsInWeek.forEach((rId) => {
        if (removedRecipeIds.includes(rId)) return;

        const recipe = recipes.find((r) => r.id === rId);
        if (recipe) {
          const currentUsage = currentWeekSlots.filter(
            (p) => p.recipe_id === rId
          ).length;
          const existing = prevBatches.find((b) => b.recipeId === rId);

          newBatches.push({
            recipeId: recipe.id,
            recipeName: recipe.name,
            image: recipe.image_url,
            targetPortions: existing
              ? existing.targetPortions
              : Math.max(recipe.default_portions, currentUsage),
          });
        }
      });

      prevBatches.forEach((prev) => {
        const alreadyAdded = newBatches.find(
          (b) => b.recipeId === prev.recipeId
        );
        if (!alreadyAdded && !removedRecipeIds.includes(prev.recipeId)) {
          newBatches.push(prev);
        }
      });

      return newBatches;
    });
  }, [plan, recipes, currentWeekStart, removedRecipeIds]);

  // Reset when week changes
  useEffect(() => {
    setSelectedBatchId(null);
    setBatches([]);
  }, [currentWeekStart]);

  const addToPlanning = useCallback((recipe) => {
    setRemovedRecipeIds((prev) => prev.filter((id) => id !== recipe.id));

    setBatches((prevBatches) => {
      const exists = prevBatches.find((b) => b.recipeId === recipe.id);
      if (!exists) {
        return [
          ...prevBatches,
          {
            recipeId: recipe.id,
            targetPortions: recipe.default_portions,
            recipeName: recipe.name,
            image: recipe.image_url,
            imageUrl: recipe.image_url,
          },
        ];
      }
      return prevBatches;
    });

    setSelectedBatchId(recipe.id);
  }, []);

  const updateBatchPortions = useCallback((id, change) => {
    setBatches((prevBatches) =>
      prevBatches.map((b) =>
        b.recipeId === id
          ? { ...b, targetPortions: Math.max(1, b.targetPortions + change) }
          : b
      )
    );
  }, []);

  const removeFromPlanning = useCallback(
    (e, id, onUpdateSlot) => {
      e.stopPropagation();

      setRemovedRecipeIds((prev) => [...prev, id]);
      setBatches((prevBatches) => prevBatches.filter((b) => b.recipeId !== id));
      setSelectedBatchId((current) => (current === id ? null : current));

      // Clear all slots with this recipe
      plan.forEach((slot) => {
        if (slot.recipe_id === id) {
          onUpdateSlot({
            plan_date: slot.plan_date,
            meal_type: slot.meal_type,
            person: slot.person,
            recipe_id: null,
          });
        }
      });
    },
    [plan]
  );

  const getAllocatedCount = useCallback(
    (recipeId) => plan.filter((p) => p.recipe_id === recipeId).length,
    [plan]
  );

  return {
    batches,
    selectedBatchId,
    setSelectedBatchId,
    addToPlanning,
    updateBatchPortions,
    removeFromPlanning,
    getAllocatedCount,
  };
}
