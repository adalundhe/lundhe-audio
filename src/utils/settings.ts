import { create } from 'zustand'


interface SiteSettings {
    visibilityMode: 'dark' | 'light';
    setVisibilityMode: (mode: 'dark' | 'light') => void
}


export const useSiteSettings = create<SiteSettings>((set) => ({
    visibilityMode: 'dark',
    setVisibilityMode(mode){
        set({
            visibilityMode: mode
        })
    }
}))
