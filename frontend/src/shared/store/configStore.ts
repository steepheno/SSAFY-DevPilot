import { create } from 'zustand';

interface ConfigStore {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  isInitialized: boolean;
  setIsInitialized: (value: boolean) => void;
  resetAll: () => void;
}

export const useConfigStore = create<ConfigStore>((set) => ({
  isLoggedIn: false,
  isInitialized: false,

  setIsInitialized: (value) =>
    set(() => ({
      isInitialized: value,
    })),

  setIsLoggedIn: (value) =>
    set(() => ({
      isLoggedIn: value,
    })),

  // 전체 리셋
  resetAll: () =>
    set(() => ({
      isLoggedIn: false,
    })),
}));
