import { create } from 'zustand';

/**
 * Global app state using Zustand.
 * Manages selected species, comparison mode, and UI panel visibility.
 */
const useStore = create((set) => ({
  // Currently selected species (for detail panel)
  selectedSpecies: null,
  setSelectedSpecies: (species) => set({ selectedSpecies: species }),

  // Comparison mode: holds two species objects or nulls
  comparisonSpecies: [null, null],
  setComparisonSlot: (index, species) =>
    set((state) => {
      const next = [...state.comparisonSpecies];
      next[index] = species;
      return { comparisonSpecies: next };
    }),
  clearComparison: () => set({ comparisonSpecies: [null, null] }),

  // Which main view is active: 'timeline' | 'comparison' | '3d'
  activeView: '3d',
  setActiveView: (view) => set({ activeView: view }),

  // Detail drawer open state
  detailOpen: false,
  setDetailOpen: (open) => set({ detailOpen: open }),

  // Search query for filtering species
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
}));

export default useStore;
