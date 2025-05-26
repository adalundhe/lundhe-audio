
import { Avatar, AvatarImage } from "~/components/ui/avatar";
import { NavigationMenuLink } from "~/components/ui/navigation-menu";
import { useSettings } from "~/hooks/use-settings";
import { useEffect } from "react";
import { Mode } from '~/components/ui/settings-provider';


export const NavBarImage = () => {
    let {mode} = useSettings()
    
    useEffect(() => {

        if (mode === 'system') {
            mode = localStorage.getItem('ui-mode') as Mode
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