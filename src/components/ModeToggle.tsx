import { GeistSans } from "geist/font/sans";
import { Moon, Sun } from "lucide-react";
 
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useSettings } from "~/hooks/use-settings";
 
export const ModeToggle = () => {
  const { updateMode } = useSettings()
 
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={`h-[130px] max-h-[130px] my-4 px-3 ${GeistSans.className}`}>
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
  )
}