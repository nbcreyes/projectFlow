import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Sidebar state store.
 * Persists the collapsed state to localStorage so the sidebar
 * remembers its position between page refreshes.
 */
const useSidebarStore = create(
  persist(
    (set) => ({
      isCollapsed: false,
      toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      collapse: () => set({ isCollapsed: true }),
      expand: () => set({ isCollapsed: false }),
    }),
    {
      name: "sidebar-state",
    }
  )
);

export default useSidebarStore;
