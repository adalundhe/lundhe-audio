"use client"
import * as React from "react";
import { Menu } from 'lucide-react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "~/components/ui/accordion";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    navigationMenuLinkStyle,
    NavigationMenuList,
    NavigationMenuTrigger
} from "~/components/ui/navigation-menu";
// import { GiMusicalNotes } from "react-icons/gi";
// import { MdHome } from "react-icons/md";
import { Separator } from "~/components/ui/separator";
// import { GiGearHammer } from "react-icons/gi";
// import { PiInfoFill } from "react-icons/pi";
// import { IoMdContact } from "react-icons/io";
// import { MdPolicy } from "react-icons/md";
// import { LiaFileContractSolid } from "react-icons/lia";
import { Courier_Prime } from 'next/font/google';
import { ScrollArea } from "~/components/ui/scroll-area";
import NavBarImage from "./NavBarImage";
import { ModeToggle } from './ModeToggle';
import { CartDropdown } from './cart/cart-dropdown';
import { useClerk, useUser } from '@clerk/nextjs'
import { Button } from './ui/button';
import { User } from 'lucide-react';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip"
import { ThemeProvider } from 'next-themes';

const courierPrime = Courier_Prime({
    weight: "400",
    subsets: ['latin']
  })
const topLevelLinkClassName =
    `${navigationMenuLinkStyle()} min-h-12 w-full items-center bg-transparent px-0`;
const topLevelRowClassName =
    "min-h-12 w-full px-2";
const nestedLinkClassName =
    `${navigationMenuLinkStyle()} min-h-10 w-full items-center bg-transparent px-0`;
export const NavBar = ({ initialSignedIn }: { initialSignedIn: boolean }) => {

    const { signOut } = useClerk()
    const { isLoaded, isSignedIn } = useUser()
    const [resolvedSignedIn, setResolvedSignedIn] = React.useState(initialSignedIn)

    React.useEffect(() => {
        if (isLoaded) {
            setResolvedSignedIn(Boolean(isSignedIn))
        }
    }, [isLoaded, isSignedIn])

    const showSignedInControls = isLoaded
        ? Boolean(isSignedIn)
        : resolvedSignedIn

    return (
        (
        <NavigationMenu className={`h-[80px] max-h-[80px] my-4 ${courierPrime.className} flex items-center w-full`}>
            <NavigationMenuList className="flex justify-start w-full h-full">
                <NavBarImage />
                <NavigationMenuItem className="h-[80px] max-h-[80px] flex flex-row items-center justify-center w-full h-full">
                    <div className="grid grid-cols-12 w-full h-full">
                        <div className='col-span-2 flex flex-col w-full justify-center h-full'>
                            <NavigationMenuTrigger className="lg:mx-[16px] hover:underline text-xl w-[60px] lg:w-[120px]" asChild>
                                <div className="cursor-default flex items-center justify-center space-x-2">
                                    <Menu 
                                        className="text-2xl top-[1px] transition duration-300 group-data-[state=open]:rotate-90"
                                        aria-hidden="true"
                                    />
                                    <p className="hidden lg:flex">menu</p>
                                </div> 
                            </NavigationMenuTrigger>
                        </div>
                        <div className='col-span-10 flex flex-col items-center justify-center px-4 h-full'>
                            <div className='flex ml-auto gap-4'>
                                {showSignedInControls ? (
                                    <Tooltip>
                                        <TooltipTrigger className='rounded-sm py-2 px-2 hover:text-white hover:bg-black dark:hover:bg-white dark:hover:text-black'>   
                                            <Link href={"/account"}>
                                                <User className='!w-[20px] !h-[20px]'/>
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent className={`${courierPrime.className} p-0 border dark:border-white tooltip-content`}>
                                           <ThemeProvider>
                                                <div className='dark:bg-black dark:text-white p-2 text-md'>
                                                   Go to my account
                                                </div>
                                           </ThemeProvider>
                                        </TooltipContent>
                                    </Tooltip>
                                ) : null}
                                {showSignedInControls ? (
                                    <CartDropdown/>
                                ) : null}
                                <ModeToggle align='end' />      
                            </div>   
                        </div>
                    </div>       
                    <NavigationMenuContent>
                        <div  className={`border-t h-[100vh] lg:mt-[34px] w-[100vw] flex flex-col w-full no-scroll bg-background text-foreground text-lg font-light`}>
                            <ScrollArea className={`h-[60vh]`}>
                                <Accordion defaultValue="home" type="single" collapsible className="flex flex-col w-full">
                                    {!showSignedInControls ? (
                                        <AccordionItem value='sign-in-or-up' className='px-2 py-2'>
                                                <Button asChild className='min-h-12 border border-black px-4 dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'>
                                                    <Link href='/sign-in' className='underline-none'>
                                                        sign in
                                                    </Link>
                                                </Button>
                                        </AccordionItem>
                                    ) : null}
                                    {showSignedInControls ? (
                                        <AccordionItem value='sign-out' className='px-2 py-2'>
                                            <Button className='min-h-12 border border-black px-4 dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black' onClick={() => signOut()}>
                                                sign out
                                            </Button>
                                        </AccordionItem>
                                    ) : null}
                                    <AccordionItem value="home" className={topLevelRowClassName}>
                                        <NavigationMenuLink asChild className={topLevelLinkClassName}>
                                            <Link href="/">home</Link>
                                        </NavigationMenuLink>
                                    </AccordionItem>
                                    <AccordionItem value="studio" className={topLevelRowClassName}>
                                        <AccordionTrigger 
                                            className="min-h-12 w-full cursor-default px-0 py-0 text-lg font-light"
                                            chevronSide="left"
                                        >   
                                            <div className="flex items-center space-x-2 cursor-default">
                                                <p className="hover:underline">
                                                    studio
                                                </p>
                                            </div>    
                                        </AccordionTrigger>
                                        <AccordionContent className="p-0">
                                            <Separator/>     
                                            <ul className="list-none pl-4">
                                                <li className="flex min-h-10 w-full items-center space-x-2"> 
                                                    {/* <PiInfoFill /> */}                   
                                                    <NavigationMenuLink asChild className={nestedLinkClassName} >
                                                        <Link href='/studio/about'>about</Link>
                                                    </NavigationMenuLink>
                                                </li>
                                                <Separator/>
                                                <li className="flex min-h-10 w-full items-center space-x-2">
                                                    {/* <GiGearHammer /> */}
                                                    <NavigationMenuLink asChild className={nestedLinkClassName}>
                                                        <Link href="/studio/gear">gear</Link>
                                                    </NavigationMenuLink>
                                                </li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="blog" className={topLevelRowClassName}>
                                        {/* <IoMdContact/> */}
                                        <NavigationMenuLink asChild className={topLevelLinkClassName}>
                                            <Link href="/blog">blog</Link>
                                        </NavigationMenuLink>
                                    </AccordionItem>
                                    <AccordionItem value='services' className={topLevelRowClassName}>
                                        <AccordionTrigger className="min-h-12 w-full cursor-default px-0 py-0 text-lg font-light" chevronSide="left">   
                                            <div className="flex items-center space-x-2 cursor-default">
                                                <p className="hover:underline">
                                                    services
                                                </p>
                                            </div>    
                                        </AccordionTrigger>
                                        <AccordionContent className="p-0">  
                                            <Separator/>        
                                            <ul className="list-none pl-4">              
                                                <li className="flex min-h-10 w-full items-center space-x-2">
                                                    <NavigationMenuLink asChild className={nestedLinkClassName}>
                                                        <Link href="/services/mastering">mastering</Link>
                                                    </NavigationMenuLink>
                                                </li>
                                                <Separator/>
                                                <li className="flex min-h-10 w-full items-center space-x-2">
                                                    <NavigationMenuLink asChild className={nestedLinkClassName}>
                                                        <Link href="/services/mixing">mixing</Link>
                                                    </NavigationMenuLink>
                                                </li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="legal" className={topLevelRowClassName}>
                                        <AccordionTrigger className="min-h-12 w-full cursor-default px-0 py-0 text-lg font-light" chevronSide="left">   
                                            <div className="flex items-center space-x-2 cursor-default">
                                                <p className="hover:underline">
                                                    legal
                                                </p>
                                            </div>    
                                        </AccordionTrigger>
                                        <AccordionContent className="p-0">  
                                            <Separator/>        
                                            <ul className="list-none pl-4">
                                                <li className="flex min-h-10 w-full items-center space-x-2">
                                                    <NavigationMenuLink asChild className={nestedLinkClassName}>
                                                        <Link href="/legal/privacy">privacy</Link>
                                                    </NavigationMenuLink>
                                                </li>
                                                <Separator/>
                                                <li className="flex min-h-10 w-full items-center space-x-2">
                                                    <NavigationMenuLink asChild className={nestedLinkClassName}>
                                                        <Link href="/legal/terms-of-service">terms of service</Link>
                                                    </NavigationMenuLink>
                                                </li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="contact" className={topLevelRowClassName}>
                                        <NavigationMenuLink asChild className={topLevelLinkClassName}>
                                            <Link href="/contact">contact</Link>
                                        </NavigationMenuLink>
                                    </AccordionItem>
                                </Accordion>
                            </ScrollArea>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
        )
    )
}
