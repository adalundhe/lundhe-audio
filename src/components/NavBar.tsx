import { GeistSans } from "geist/font/sans";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "~/components/ui/navigation-menu"
import { Avatar, AvatarImage } from "~/components/ui/avatar"


export const NavBar = () => {
    return (
        
      <NavigationMenu className={`h-[80px] pt-8 pb-8 px-3 ${GeistSans.className}`}>
        <NavigationMenuList className="md:w-[50%]">
            <Avatar className="w-[min(80px,calc(100vmin/4))] h-[min(80px,calc(100vmin/4))]">
            
                <NavigationMenuLink href="/" className="cursor-pointer">     
                    <AvatarImage src="/lundhe_audio_logo.png"/>
                </NavigationMenuLink>
            </Avatar>
            <NavigationMenuItem className="font-medium w-[min(80px,calc(100vmin/4))] flex justify-center">
                <NavigationMenuLink href="/" className="cursor-pointer hover:underline">home</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem className="font-medium w-[min(80px,calc(100vmin/4))] flex justify-center">
                <NavigationMenuLink href="/about" className="cursor-pointer hover:underline">about</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem className="font-medium w-[min(80px,calc(100vmin/4))] flex justify-center">
                <NavigationMenuLink href="/studio" className="cursor-pointer hover:underline">studio</NavigationMenuLink>
            </NavigationMenuItem>
        </NavigationMenuList>
        </NavigationMenu>
    )
}