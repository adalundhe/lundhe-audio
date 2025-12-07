"use client"
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Courier_Prime } from 'next/font/google';
 
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";


const courierPrime = Courier_Prime({
  weight: "400",
  subsets: ['latin']
})
 
export const ModeToggle = ({
  align
}: {
  align: 'start' | 'center' | 'end'
}) => {

  const { setTheme } = useTheme();
 
  return (
    <div className={`self-${align} mr-4 flex flex-col items-center justify-center h-full`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="mr-4">
          <Button className="focus:outline-none border-transparent p-0">
            <div className="h-full flex items-center justify-end w-[50px]">
              <div className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 xl:w-[1.5vmax] xl:h-[1.5vmax] lg:w-[2vmax] lg:h-[2vmax] md:w-[2.5vmax] md:h-[2.5vmax] w-[3vmax] h-[3vmax]  flex items-center justify-center">

                <Sun className="focus:outline-none border-transparent" />
              </div>
           
              <div className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 xl:w-[1.5vmax] xl:h-[1.5vmax] lg:w-[2vmax] lg:h-[2vmax] md:w-[2.5vmax] md:h-[2.5vmax] w-[3vmax] h-[3vmax] flex items-center justify-center">
                <Moon className="focus:outline-none border-transparent" />
              </div>
             </div>
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className={`mt-4 h-[130px] max-h-[130px] px-3 ${courierPrime.className}`}>
          <DropdownMenuItem className="text-lg" onClick={() => setTheme("light")}>
            Light
          </DropdownMenuItem>
          <DropdownMenuItem  className="text-lg" onClick={() => setTheme("dark")}>
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem className="text-lg" onClick={() => setTheme(
            window ? (
              window.matchMedia("(prefers-color-scheme: dark)")
              .matches
              ? "dark"
              : "light"
            ) : "dark"
          )}>
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}