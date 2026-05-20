import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import type { Video, Stats } from './types';

export const useStore = create(
  combine(
    {
      historyStack: [] as Video[],
      stats: { loaded: 0, cached: 0, played: 0 } as Stats,
    },
    (set) => ({
      addHistory: (video: Video) =>
        set((state) => {
          if (state.historyStack.length > 0 && state.historyStack[state.historyStack.length - 1].id === video.id) {
            return state;
          }
          return {
            historyStack: [...state.historyStack, video].slice(-20),
          };
        }),
      updateStats: (updates: Partial<Stats>) =>
        set((state) => ({
          stats: { ...state.stats, ...updates },
        })),
      incrementPlayed: () =>
        set((state) => ({
          stats: { ...state.stats, played: state.stats.played + 1 },
        })),
    })
  )
);
