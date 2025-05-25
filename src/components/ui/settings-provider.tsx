import { useEffect } from 'react';
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

  let { mode } = useSettings();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    mode = checkSystemPreference(mode);
    root.classList.add(mode);
  }, [mode]);

  return { 
    mode
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

