import { Moon, Sun } from "lucide-react";
import { Courier_Prime } from 'next/font/google';
 
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useSettings } from "~/hooks/use-settings";

const courierPrime = Courier_Prime({
  weight: "400",
  subsets: ['latin']
})
 
export const ModeToggle = ({
  align
}: {
  align: 'start' | 'center' | 'end'
}) => {
  const { updateMode } = useSettings()
 
  return (
    <div className={`self-${align} mr-4 flex flex-col items-center justify-center h-full`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="mr-4">
          <Button className="focus:outline-none border-transparent p-0">
            <div className="h-full flex items-center justify-end w-[50px]">

              <Sun size={26} className="focus:outline-none border-transparent rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon size={26} className="focus:outline-none border-transparent absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </div>
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className={`mt-4 h-[130px] max-h-[130px] px-3 ${courierPrime.className}`}>
          <DropdownMenuItem className="text-lg" onClick={() => updateMode("light")}>
            Light
          </DropdownMenuItem>
          <DropdownMenuItem  className="text-lg" onClick={() => updateMode("dark")}>
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem className="text-lg" onClick={() => updateMode("system")}>
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}