"use client"
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
import { ClerkProvider, SignedIn, SignedOut, SignInButton, useClerk, UserButton } from '@clerk/nextjs'
import { Button } from './ui/button';

const courierPrime = Courier_Prime({
    weight: "400",
    subsets: ['latin']
  })
  


export const NavBar = () => {

    const { signOut } = useClerk()

    return (
        (
            <NavigationMenu className={`h-[80px] max-h-[80px] my-4 ${courierPrime.className}`}>
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
                            <div className='flex ml-auto'>
                                <SignedIn>
                                    <CartDropdown/>
                                </SignedIn>
                                <ModeToggle align='end' />      
                            </div>   
                        </div>
                    </div>       
                    <NavigationMenuContent>
                        <div  className={`border-t h-[100vh] lg:mt-[34px] w-[100vw] flex flex-col w-full no-scroll text-lg font-light bg-white dark:bg-black`}>
                            <ScrollArea className={`h-[60vh]`}>
                                <Accordion defaultValue="home" type="single" collapsible className="flex flex-col w-full">
                                    <SignedOut>
                                        <AccordionItem value='sign-in-or-up'>
                                                <Button className='border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black my-4'>
                                                    <NavigationMenuLink href='/sign-in' className='underline-none'>
                                                        sign in
                                                    </NavigationMenuLink>
                                                </Button>
                                        </AccordionItem>
                                    </SignedOut>
                                    <SignedIn>
                                        <AccordionItem value='sign-out'>
                                            <Button className='border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black my-4' onClick={() => signOut()}>
                                                sign out
                                            </Button>
                                        </AccordionItem>
                                    </SignedIn>
                                    <AccordionItem value="home" className={"py-2 px-2 h-[40px] w-full flex grow-1 items-center space-x-2"}>
                                        {/* <MdHome/> */}
                                        <NavigationMenuLink href="/" className={navigationMenuLinkStyle()}>
                                            home
                                        </NavigationMenuLink>
                                    </AccordionItem>
                                    <AccordionItem value="studio" className="px-2">
                                        <AccordionTrigger 
                                            className="p-0 cursor-default py-2 text-lg font-light"
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
                                                <li className="w-full py-2 flex items-center space-x-2 grow-1"> 
                                                    {/* <PiInfoFill /> */}                   
                                                    <NavigationMenuLink href='/studio/about' className={navigationMenuLinkStyle()} >
                                                        about
                                                    </NavigationMenuLink>
                                                </li>
                                                <Separator/>
                                                <li className="w-full py-2 flex items-center space-x-2 grow-1">
                                                    {/* <GiGearHammer /> */}
                                                    <NavigationMenuLink href="/studio/gear" className={navigationMenuLinkStyle()}>
                                                        gear
                                                    </NavigationMenuLink>
                                                </li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="blog" className="py-2 px-2 h-[40px] w-full flex grow-1 items-center space-x-2">
                                        {/* <IoMdContact/> */}
                                        <NavigationMenuLink href="/blog" className="cursor-pointer hover:underline">
                                            blog
                                        </NavigationMenuLink>
                                    </AccordionItem>
                                    <AccordionItem value='services' className='px-2'>
                                        <AccordionTrigger className="p-0 cursor-default py-2 text-lg font-light" chevronSide="left">   
                                            <div className="flex items-center space-x-2 cursor-default">
                                                <p className="hover:underline">
                                                    services
                                                </p>
                                            </div>    
                                        </AccordionTrigger>
                                        <AccordionContent className="p-0">  
                                            <Separator/>        
                                            <ul className="list-none pl-4">              
                                                <li className="w-full py-2 flex items-center space-x-2 grow-1">
                                                    <NavigationMenuLink href="/services/mastering" className={navigationMenuLinkStyle()}>
                                                        mastering
                                                    </NavigationMenuLink>
                                                </li>
                                                <Separator/>
                                                <li className="w-full py-2 flex items-center space-x-2 grow-1">
                                                    <NavigationMenuLink href="/services/mixing" className={navigationMenuLinkStyle()}>
                                                        mixing
                                                    </NavigationMenuLink>
                                                </li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="legal" className="px-2">
                                        <AccordionTrigger className="p-0 cursor-default py-2 text-lg font-light" chevronSide="left">   
                                            <div className="flex items-center space-x-2 cursor-default">
                                                <p className="hover:underline">
                                                    legal
                                                </p>
                                            </div>    
                                        </AccordionTrigger>
                                        <AccordionContent className="p-0">  
                                            <Separator/>        
                                            <ul className="list-none pl-4">
                                                <li className="w-full py-2 flex items-center space-x-2 grow-1">
                                                    <NavigationMenuLink href="/legal/privacy" className={navigationMenuLinkStyle()}>
                                                        privacy
                                                    </NavigationMenuLink>
                                                </li>
                                                <Separator/>
                                                <li className="w-full py-2 flex items-center space-x-2 grow-1">
                                                    <NavigationMenuLink href="/legal/terms-of-service" className={navigationMenuLinkStyle()}>
                                                        terms of service
                                                    </NavigationMenuLink>
                                                </li>
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="contact" className="py-2 px-2 h-[40px] w-full flex grow-1 items-center space-x-2">
                                        <NavigationMenuLink href="/contact" className="cursor-pointer hover:underline">
                                            contact
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