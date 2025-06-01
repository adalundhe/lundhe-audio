
import { Avatar, AvatarImage } from "~/components/ui/avatar";
import { NavigationMenuLink } from "~/components/ui/navigation-menu";
import { useTheme } from "~/hooks/use-theme";

export const NavBarImage = () => {

    const theme = useTheme()


    return (

        <div className="px-4">
            <Avatar className="w-[min(80px,calc(100vmin/4))] h-[min(80px,calc(100vmin/4))]">
                <NavigationMenuLink href="/" className="cursor-pointer">     
                    <AvatarImage src={theme === 'dark' ?  "/lundhe_audio_inverted.png" : "/lundhe_audio_logo.png" }/>
                </NavigationMenuLink>
            </Avatar>
        </div>
    )
}