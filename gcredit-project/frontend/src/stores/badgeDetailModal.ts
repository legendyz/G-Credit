import { create } from 'zustand';

interface BadgeDetailModalState {
  isOpen: boolean;
  badgeId: string | null;
  openModal: (badgeId: string) => void;
  closeModal: () => void;
}

export const useBadgeDetailModal = create<BadgeDetailModalState>((set) => ({
  isOpen: false,
  badgeId: null,
  openModal: (badgeId: string) => set({ isOpen: true, badgeId }),
  closeModal: () => set({ isOpen: false, badgeId: null }),
}));
