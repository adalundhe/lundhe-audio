
import { Avatar, AvatarImage } from "~/components/ui/avatar";
import { NavigationMenuLink } from "~/components/ui/navigation-menu";
import { useSettings } from "~/hooks/use-settings";
import { useEffect } from "react";
import { type Mode } from '~/components/ui/settings-provider';

function initTheme() {

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

export const NavBarImage = () => {
    const {mode, updateMode} = useSettings()
    
    useEffect(() => {

        if (mode === 'system') {
            updateMode(initTheme())
        }

    }, [mode])
    
    return (

        <div className="px-4">
            <Avatar className="w-[min(80px,calc(100vmin/4))] h-[min(80px,calc(100vmin/4))]">
                <NavigationMenuLink href="/" className="cursor-pointer">     
                    <AvatarImage src={mode === 'light' ? "/lundhe_audio_logo.png" : "/lundhe_audio_inverted.png"}/>
                </NavigationMenuLink>
            </Avatar>
        </div>
    )
}