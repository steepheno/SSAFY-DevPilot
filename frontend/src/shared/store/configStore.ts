import { create } from 'zustand';
import { getInitialSettingsStatus } from '@/features/initialSettings/api/getInitialSettingsStatus';

interface ConfigStore {
  // 인증 상태
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;

  // 초기화 상태
  isInitialized: boolean;
  setIsInitialized: (value: boolean) => void;

  // 초기화 API 호출 상태
  loadingInit: boolean;
  errorInit: string | null;

  // 초기화 체크 액션
  checkInitialization: () => Promise<void>;
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  isLoggedIn: false,
  setIsLoggedIn: (value) => set({ isLoggedIn: value }),

  isInitialized: false,
  setIsInitialized: (value) => set({ isInitialized: value }),

  loadingInit: false,
  errorInit: null,

  checkInitialization: async () => {
    const { loadingInit, isInitialized } = get();
    // 이미 로딩 중이거나 초기화가 끝났으면 재호출 방지
    if (loadingInit || isInitialized) return;

    set({ loadingInit: true, errorInit: null });
    try {
      const { initialized } = await getInitialSettingsStatus();
      set({ isInitialized: initialized });
    } catch (err: any) {
      console.error('초기 설정 상태 확인 실패:', err);
      set({ errorInit: '서버가 비활성 상태입니다. DevPilot을 재시작해주세요.' });
    } finally {
      set({ loadingInit: false });
    }
  },
}));
