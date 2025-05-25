import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Mode = 'light' | 'dark' | 'system'
interface SettingsState {
  mode: Mode
  updateMode: (mode: Mode) => void
}

export const useSettingStore = create<SettingsState>()(
    persist(
        (set) => {

            let mode: Mode = 'system'
            if (typeof window !== 'undefined' &&
                window.document){
                   mode = (
                    localStorage.getItem('ui-mode') ?? 'system'
                   ) as Mode
                }

            return ({
                mode: mode,
                updateMode: (mode) => {
      
                  localStorage.setItem("ui-mode", mode);
                  set(() => ({ mode: mode }))
                },
              })
        },
        {
          name: 'settings-storage',
        },
      ),
)