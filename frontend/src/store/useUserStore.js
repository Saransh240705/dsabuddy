import { create } from 'zustand';

export const useUserStore = create((set) => ({
  user: null,
  branch: '',
  setUser: (user) => {
    set({ 
      user, 
      branch: user?.branch || '' 
    });
  },
  setBranch: (branch) => set((state) => {
    const updatedUser = state.user ? { ...state.user, branch } : null;
    return {
      branch,
      user: updatedUser
    };
  }),
}));
