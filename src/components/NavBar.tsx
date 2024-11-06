import { GeistSans } from "geist/font/sans";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuSub,
  NavigationSubMenuTrigger,
  NavigationSubMenuContent,
  navigationMenuLinkStyle 

} from "~/components/ui/navigation-menu"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "~/components/ui/accordion"
  import { CiMenuBurger } from "react-icons/ci";
import { GiMusicalNotes } from "react-icons/gi";
import { MdHome } from "react-icons/md";
import { Separator } from "~/components/ui/separator"
import { GiGearHammer } from "react-icons/gi";
import { PiInfoFill } from "react-icons/pi";
import Link from "next/link";
import { GiGrandPiano } from "react-icons/gi";
import { TbDeviceTvOld } from "react-icons/tb";
import { Avatar, AvatarImage } from "~/components/ui/avatar"
import { GiDrumKit } from "react-icons/gi";
import { PiFadersFill } from "react-icons/pi";
import { BiSolidSpeaker } from "react-icons/bi";
import { GiMusicalKeyboard } from "react-icons/gi";
import { IoMdContact } from "react-icons/io";
import { MdPolicy } from "react-icons/md";
import { LiaFileContractSolid } from "react-icons/lia";
import { ScrollArea } from "~/components/ui/scroll-area"


export const NavBar = () => {
    
    return (
        
      <NavigationMenu className={`h-[80px] max-h-[80px] my-4 px-3 ${GeistSans.className}`}>
        <NavigationMenuList className="flex justify-start">
            <Avatar className="w-[min(80px,calc(100vmin/4))] h-[min(80px,calc(100vmin/4))]">
                <Link href="/" className="cursor-pointer" passHref>
                    <NavigationMenuLink>     
                        <AvatarImage src="/lundhe_audio_logo.png"/>
                    </NavigationMenuLink>
                </Link>
            </Avatar>
            <NavigationMenuItem className="h-[40px]">
                <NavigationMenuTrigger className="lg:mx-[16px] lg:border lg:shadow-sm hover:underline text-sm w-[94px]" asChild>
                    <div className="cursor-default flex items-center justify-center space-x-2 lg:hover:bg-gray-50 lg:focus:bg-gray-50">
                        <CiMenuBurger 
                            className="text-2xl top-[1px] transition duration-300 group-data-[state=open]:rotate-90"
                            aria-hidden="true"
                        />
                        <p className="hidden lg:flex">menu</p>
                    </div>    
                </NavigationMenuTrigger>     
                <NavigationMenuContent>
                    <div className="border-t h-[100vh] lg:mt-[34px] w-[100vw] bg-white flex flex-col w-full no-scroll">
                        <ScrollArea className="h-[60vh]">
                            <Accordion defaultValue="home" type="single" collapsible className="flex flex-col w-full">
                                <AccordionItem value="home" className=" text-lg hover:bg-gray-50 focus:bg-gray-50 py-2 px-2 h-[40px] w-full flex grow-1 items-center space-x-2 hover:bg-gray-50 focus:bg-gray-50">
                                    <MdHome/>
                                    <Link href="/" className="cursor-pointer hover:underline" passHref>
                                        <NavigationMenuLink className={navigationMenuLinkStyle()}>
                                            home
                                        </NavigationMenuLink>
                                    </Link>
                                </AccordionItem>
                                <AccordionItem value="studio" className="px-2 hover:bg-gray-50 focus:bg-gray-50">
                                    <AccordionTrigger 
                                        className="hover:bg-gray-50 focus:bg-gray-50 p-0 cursor-default py-2"
                                    >   
                                        <div className="flex items-center space-x-2 cursor-default">
                                            <GiMusicalNotes 
                                                aria-hidden="true"
                                            />
                                            <p className="hover:underline">
                                                studio
                                            </p>
                                        </div>    
                                    </AccordionTrigger>
                                    <AccordionContent className="p-0">
                                        <Separator/>     
                                        <ul className="list-none pl-4">
                                            <li className="w-full py-2 flex items-center space-x-2 grow-1 hover:bg-gray-50 focus:bg-gray-50"> 
                                                <PiInfoFill />
                                                <Link href="/about" className="cursor-pointer hover:underline" passHref>                     
                                                    <NavigationMenuLink className={navigationMenuLinkStyle()}>
                                                        about
                                                    </NavigationMenuLink>
                                                </Link>
                                            </li>
                                            <Separator/>
                                            <li className="w-full py-2 flex items-center space-x-2 grow-1 hover:bg-gray-50 focus:bg-gray-50">
                                                <GiGearHammer />
                                                <Link href="/gear" className="cursor-pointer hover:underline">                                                
                                                    <NavigationMenuLink className={navigationMenuLinkStyle()}>
                                                        gear
                                                    </NavigationMenuLink>
                                                </Link>
                                            </li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                                {/* <AccordionItem value="services" className="px-2 hover:bg-gray-50 focus:bg-gray-50">
                                    <AccordionTrigger className="hover:bg-gray-50 focus:bg-gray-50 p-0 cursor-default py-2">   
                                        <div className="flex items-center space-x-2 cursor-default">
                                            <PiFadersFill 
                                                aria-hidden="true"
                                            />
                                            <p className="hover:underline">
                                                services
                                            </p>
                                        </div>    
                                    </AccordionTrigger>
                                    <AccordionContent className="p-0">
                                        <Separator/>     
                                        <ul className="list-none pl-4">
                                            <li className="w-full py-2 flex items-center space-x-2 grow-1 hover:bg-gray-50 focus:bg-gray-50">
                                                <TbDeviceTvOld/>
                                                <Link href="/services/commercial_audio" className="cursor-pointer hover:underline" passHref>                                                
                                                    <NavigationMenuLink className={navigationMenuLinkStyle()}>
                                                        commercial audio
                                                    </NavigationMenuLink>                            
                                                </Link>
                                            </li>
                                            <Separator/>
                                            <li className="w-full py-2 flex items-center space-x-2 grow-1 hover:bg-gray-50 focus:bg-gray-50">
                                                <GiGrandPiano/>
                                                <Link href="/services/composition" className="cursor-pointer hover:underline" passHref>                                                
                                                    <NavigationMenuLink className={navigationMenuLinkStyle()}>
                                                        composition
                                                    </NavigationMenuLink>
                                                </Link>
                                            </li>
                                            <Separator/>
                                            <li className="w-full py-2 flex items-center space-x-2 grow-1 hover:bg-gray-50 focus:bg-gray-50">
                                                <BiSolidSpeaker/>
                                                <Link href="/services/mastering" className="cursor-pointer hover:underline" passHref>                                                
                                                    <NavigationMenuLink className={navigationMenuLinkStyle()}>
                                                        mastering
                                                    </NavigationMenuLink>
                                                </Link>
                                            </li>
                                            <Separator/>
                                            <li className="w-full py-2 flex items-center space-x-2 grow-1 hover:bg-gray-50 focus:bg-gray-50"> 
                                                <GiDrumKit/>
                                                <Link href="/services/mixing" className="cursor-pointer hover:underline" passHref>                                                
                                                    <NavigationMenuLink className={navigationMenuLinkStyle()}>
                                                        mixing
                                                    </NavigationMenuLink>
                                                </Link>
                                            </li>
                                            <Separator/>
                                            <li className="w-full py-2 flex items-center space-x-2 grow-1 hover:bg-gray-50 focus:bg-gray-50">
                                                <GiMusicalKeyboard/>
                                                <Link href="/services/sound_design" className="cursor-pointer hover:underline" passHref>                                                
                                                    <NavigationMenuLink className={navigationMenuLinkStyle()}>
                                                        sound design
                                                    </NavigationMenuLink>
                                                </Link>
                                            </li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem> */}
                                <AccordionItem value="legal" className="px-2 hover:bg-gray-50 focus:bg-gray-50">
                                    <AccordionTrigger className="hover:bg-gray-50 focus:bg-gray-50 p-0 cursor-default py-2">   
                                        <div className="flex items-center space-x-2 cursor-default">
                                            <LiaFileContractSolid 
                                                aria-hidden="true"
                                            />
                                            <p className="hover:underline">
                                                legal
                                            </p>
                                        </div>    
                                    </AccordionTrigger>
                                    <AccordionContent className="p-0">  
                                        <Separator/>        
                                        <ul className="list-none pl-4">
                                            <li className="w-full py-2 flex items-center space-x-2 grow-1 hover:bg-gray-50 focus:bg-gray-50">
                                                <MdPolicy/>
                                                <Link href="/privacy" className="cursor-pointer hover:underline" passHref>                                                
                                                    <NavigationMenuLink className={navigationMenuLinkStyle()}>
                                                        privacy
                                                    </NavigationMenuLink>
                                                </Link>
                                            </li>
                                            <Separator/>
                                            <li className="w-full py-2 flex items-center space-x-2 grow-1 hover:bg-gray-50 focus:bg-gray-50">
                                                <LiaFileContractSolid/>
                                                <Link href="/terms_of_service" className="cursor-pointer hover:underline" passHref>                                                
                                                    <NavigationMenuLink className={navigationMenuLinkStyle()}>
                                                        terms of service
                                                    </NavigationMenuLink>
                                                </Link>
                                            </li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="contact" className="hover:bg-gray-50 focus:bg-gray-50 py-2 px-2 h-[40px] w-full flex grow-1 items-center space-x-2 hover:bg-gray-50 focus:bg-gray-50">
                                    <IoMdContact/>
                                    <Link href="/contact" className="cursor-pointer hover:underline" passHref>
                                        <NavigationMenuLink className={navigationMenuLinkStyle()}>
                                            contact
                                        </NavigationMenuLink>
                                    </Link>
                                </AccordionItem>
                            </Accordion>
                        </ScrollArea>
                    </div>
                </NavigationMenuContent>
            </NavigationMenuItem>
        </NavigationMenuList>
    </NavigationMenu>
    )
}