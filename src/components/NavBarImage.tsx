
import { Avatar, AvatarImage } from "~/components/ui/avatar";
import { NavigationMenuLink } from "~/components/ui/navigation-menu";
import { useSettings } from "~/hooks/use-settings";
import { useEffect } from "react";
import { getInitTheme } from "~/stores/settings";

export const NavBarImage = () => {
    const {mode, updateMode} = useSettings()
    
    useEffect(() => {

        if (mode === 'system') {
            updateMode(getInitTheme())
        }

    }, [mode, updateMode])
    
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