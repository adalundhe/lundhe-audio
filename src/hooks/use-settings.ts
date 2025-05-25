import { useCallback } from "react";
import { useSettingStore } from "~/stores/settings";

export const useSettings = () => useSettingStore(
    useCallback((state) => state, [])
);