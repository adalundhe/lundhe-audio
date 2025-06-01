import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Mode = 'light' | 'dark' | 'system'
interface SettingsState {
  mode: Mode
  updateMode: (mode: Mode) => void
}

export function getInitTheme() {

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");


    let mode = localStorage.getItem('ui-mode') ?? 'system'
    if (mode === 'system') {
        mode = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"
    }


    return mode as Mode
}


export const useSettingStore = create<SettingsState>()(
    persist(
        (set) => {

            let mode: Mode = 'system'
            if (typeof window !== 'undefined' && window.document){
              mode = getInitTheme()
            
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