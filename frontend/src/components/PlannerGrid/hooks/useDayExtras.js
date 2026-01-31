import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

/**
 * Hook to manage day extras with localStorage persistence
 */
export function useDayExtras(currentWeekStart) {
  const weekKey = format(currentWeekStart, 'yyyy-MM-dd');

  const [dayExtras, setDayExtras] = useState(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-undef
      const stored = localStorage.getItem(`dayExtras_${weekKey}`);
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  });

  // Reset extras for new week
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-undef
      const stored = localStorage.getItem(`dayExtras_${weekKey}`);
      setDayExtras(stored ? JSON.parse(stored) : {});
    }
  }, [weekKey]);

  // Persist to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-undef
      localStorage.setItem(`dayExtras_${weekKey}`, JSON.stringify(dayExtras));
    }
  }, [dayExtras, weekKey]);

  const addExtra = useCallback(
    (date, presetName, meals) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayExtrasArray = dayExtras[dateStr] || [];

      let mealTypeId = null;
      const mealType = meals.find(
        (m) => !m.is_standard && m.name === presetName
      );

      if (mealType) {
        mealTypeId = mealType.id;
      } else {
        const anyExtra = meals.find((m) => !m.is_standard);
        if (anyExtra) {
          mealTypeId = anyExtra.id;
        }
      }

      if (!mealTypeId) {
        return;
      }

      const countSameType = dayExtrasArray.filter(
        (e) => e.meal_type_id === mealTypeId
      ).length;

      const localExtraId = `${presetName.toLowerCase()}_${countSameType + 1}`;

      const newExtra = {
        id: localExtraId,
        meal_type_id: mealTypeId,
        preset_name: presetName,
        name: presetName,
      };

      setDayExtras((prev) => ({
        ...prev,
        [dateStr]: [...dayExtrasArray, newExtra],
      }));
    },
    [dayExtras]
  );

  const removeExtra = useCallback((date, extraId, plan, onUpdateSlot) => {
    const dateStr = format(date, 'yyyy-MM-dd');

    // Clear all plan slots with this specific extra
    plan.forEach((slot) => {
      if (slot.plan_date === dateStr && slot.extra_id === extraId) {
        onUpdateSlot({
          plan_date: slot.plan_date,
          meal_type_id: slot.meal_type_id,
          extra_id: slot.extra_id,
          person: slot.person,
          recipe_id: null,
        });
      }
    });

    // Remove the extra from state
    setDayExtras((prev) => ({
      ...prev,
      [dateStr]: (prev[dateStr] || []).filter((extra) => extra.id !== extraId),
    }));
  }, []);

  return { dayExtras, addExtra, removeExtra };
}
