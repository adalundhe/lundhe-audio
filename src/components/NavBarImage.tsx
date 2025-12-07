"use client"
import { Avatar } from "~/components/ui/avatar";
import { NavigationMenuLink } from "~/components/ui/navigation-menu";
import { memo } from 'react'
import Image from "next/image";

const NavBarImage = () => {


    return (

        <div className="px-4">
            <Avatar className="w-[min(80px,calc(100vmin/4))] h-[min(80px,calc(100vmin/4))]">
                <NavigationMenuLink href="/" className="cursor-pointer">     
                    <Image className="aspect-square h-full w-full dark:invert" loading="eager" width={80} height={80} alt="Lundhe Audio logo" src="/lundhe_audio_logo.png"/>
                </NavigationMenuLink>
            </Avatar>
        </div>
    )
}

export default memo(NavBarImage)