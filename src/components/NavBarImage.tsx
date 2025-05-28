
import { Avatar, AvatarImage } from "~/components/ui/avatar";
import { NavigationMenuLink } from "~/components/ui/navigation-menu";
import { useSettings } from "~/hooks/use-settings";
import { useEffect, useState } from "react";
import { type Mode } from '~/components/ui/settings-provider';


export const NavBarImage = () => {
    const {mode} = useSettings()
    const [navBarMode, setMode] = useState<typeof mode>(mode)
    
    useEffect(() => {

        if (mode === 'system') {
            setMode(localStorage.getItem('ui-mode') as Mode)
        } else {
            setMode(mode)
        }

    }, [mode, setMode])
    
    return (

        <div className="px-4">
            <Avatar className="w-[min(80px,calc(100vmin/4))] h-[min(80px,calc(100vmin/4))]">
                <NavigationMenuLink href="/" className="cursor-pointer">     
                    <AvatarImage src={navBarMode === 'light' ? "/lundhe_audio_logo.png" : "/lundhe_audio_inverted.png"}/>
                </NavigationMenuLink>
            </Avatar>
        </div>
    )
}