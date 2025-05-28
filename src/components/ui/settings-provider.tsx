import { useEffect, useRef } from 'react';
import { useSettings } from '~/hooks/use-settings';

export type Mode = "light" | "dark" | "system";


const checkSystemPreference = (mode: Mode) => {
  return mode === 'light' || mode === 'dark' ? mode : (
    window.matchMedia("(prefers-color-scheme: dark)")
    .matches
    ? "dark"
    : "light"
  );
}

export const useSystemPreference = () => {

  const { mode } = useSettings();
  const modeRef = useRef<typeof mode>(mode)

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    modeRef.current = checkSystemPreference(mode);
    root.classList.add(modeRef.current);
  }, [mode, modeRef]);

  return { 
    mode: modeRef.current
  }

}

 
export function SettingsProvider() {

  const { updateMode } = useSettings();

    useEffect(() => {
      const storedTheme =
        (localStorage.getItem("ui-mode") as Mode);
        updateMode(storedTheme);

    }, [updateMode]);
  
  
    useSystemPreference();
    return null;
}

