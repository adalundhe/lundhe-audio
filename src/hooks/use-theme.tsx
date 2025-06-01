import { useEffect } from "react";
import { useSettings } from "./use-settings";
import { getInitTheme } from "~/stores/settings";

export const useTheme = () => {

    const {mode, updateMode} = useSettings()
    useEffect(() => {

        if (mode === 'system') {
            updateMode(getInitTheme())
        }

    }, [mode, updateMode])

  return mode as 'light' | 'dark';
};