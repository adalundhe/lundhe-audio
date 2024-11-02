import { GeistSans } from "geist/font/sans";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,

} from "~/components/ui/navigation-menu"
import Link from "next/link";

import { Avatar, AvatarImage } from "~/components/ui/avatar"


export const NavBar = () => {
    return (
        
      <NavigationMenu className={`h-[80px] max-h-[80px] my-4 px-3 ${GeistSans.className}`}>
        <NavigationMenuList className="flex justify-start">
            <Avatar className="w-[min(80px,calc(100vmin/4))] h-[min(80px,calc(100vmin/4))]">
                
                <NavigationMenuLink href="/" className="cursor-pointer">     
                    <AvatarImage src="/lundhe_audio_logo.png"/>
                </NavigationMenuLink>
            </Avatar>
            <NavigationMenuItem>
                <NavigationMenuTrigger className="mx-[16px] cursor-pointer hover:underline text-lg w-[106px]">menu</NavigationMenuTrigger>     
                <NavigationMenuContent>
                    <ul className="text-lg ml-[106px] border-y px-4 bg-white w-[106px] flex flex-col justify-center space-y-4 py-3 font-medium items-center shadow rounded-sm">     
                        <li>
                            <NavigationMenuLink asChild>
                                <Link href="/" className="cursor-pointer hover:underline">home</Link>
                            </NavigationMenuLink>
                        </li>  
                        <li>
                            <NavigationMenuLink asChild>
                                <Link href="/about" className="cursor-pointer hover:underline">about</Link>
                            </NavigationMenuLink>
                        </li>
                        <li>
                            <NavigationMenuLink asChild>
                                <Link href="/studio" className="cursor-pointer hover:underline">studio</Link>
                            </NavigationMenuLink>
                        </li>
                    </ul>
                </NavigationMenuContent>
            </NavigationMenuItem>
        </NavigationMenuList>
        </NavigationMenu>
    )
}