import { create } from 'zustand';

export const useUIStore = create((set) => ({
  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // Modals
  createTicketModal: false,
  openCreateTicket: () => set({ createTicketModal: true }),
  closeCreateTicket: () => set({ createTicketModal: false }),

  // Filters
  ticketFilter: '',
  setTicketFilter: (filter) => set({ ticketFilter: filter }),
  categoryFilter: '',
  setCategoryFilter: (category) => set({ categoryFilter: category }),

  // Theme
  theme: 'dark',
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
}));
