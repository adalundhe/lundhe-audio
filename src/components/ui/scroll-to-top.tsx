import { Button, ButtonProps } from "~/components/ui/button";
import { useEffect, useState } from "react";
import { CircleArrowUp } from 'lucide-react'

export function ScrollToTop({
  minHeight, // Height from which button will be visible
  scrollTo, // Height to go on scroll to top
  ...props
}: ButtonProps & { minHeight?: number; scrollTo?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
        console.log('SCROLL', document.documentElement.scrollTop, visible)
      setVisible(document.documentElement.scrollTop >= (minHeight ?? 0));
    };

    onScroll();
    document.addEventListener("scroll", onScroll);

    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
        className={`fixed -left-1 md:left-4 lg:left-10 flex transition-all ease-in-out duration-1000 ${visible ? 'bottom-10' : '-bottom-80'}`}
    >
      
        <Button
            className={`w-fit h-fit transition-all ease-in-out duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
            onClick={() =>
                window.scrollTo({
                top: scrollTo ?? 0,
                behavior: "smooth",
                })
            }
        >
          <CircleArrowUp size={26} className="scroll-to-top-svg"/>
        </Button>

    </div> 
  );
}