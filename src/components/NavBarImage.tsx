"use client"
import { Avatar } from "~/components/ui/avatar";
import { NavigationMenuLink } from "~/components/ui/navigation-menu";
import { memo } from 'react'
import Image from "next/image";
import Link from "next/link";

const NavBarImage = () => {


    return (

        <div className="px-4">
            <Avatar className="w-[min(80px,calc(100vmin/4))] h-[min(80px,calc(100vmin/4))]">
                <NavigationMenuLink asChild className="cursor-pointer">
                    <Link href="/">
                    <Image
                        className="aspect-square h-full w-full dark:hidden"
                        loading="eager"
                        width={80}
                        height={80}
                        alt="Lundhe Audio logo"
                        src="/lundhe_audio_logo.png"
                    />
                    <Image
                        className="hidden aspect-square h-full w-full dark:block"
                        loading="eager"
                        width={80}
                        height={80}
                        alt="Lundhe Audio logo"
                        src="/lundhe_audio_logo_dark.png"
                    />
                    </Link>
                </NavigationMenuLink>
            </Avatar>
        </div>
    )
}

export default memo(NavBarImage)
