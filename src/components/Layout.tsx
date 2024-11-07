import { Separator } from "~/components/ui/separator"
import React from "react";

export const Layout = ({
    children
}: {
    children: JSX.Element
}) =>  {

  return (
    <>
      <div className="w-full flex justify-center">   
        <Separator className="w-3/4"/>
      </div>
      <main className="w-full h-full my-4 h-full px-3 h-full flex flex-col grow justify-center items-center">
        {children}
      </main>
      <div className="w-full flex justify-center">   
        <Separator className="w-3/4"/>
      </div>
    </>
  );
}
