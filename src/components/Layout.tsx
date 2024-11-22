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
      <main className="row-span-2 w-full my-4 px-3 flex justify-center items-center h-full">
        {children}
      </main>
    </>
  );
}
