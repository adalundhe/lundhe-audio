import { Layout } from "~/components/Layout";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { GearImage } from "./_components/gear-image";
import Loader from './loading'
import { Suspense } from "react";
import { type ReactNode } from "react";


export default async function StudioLayout({
    children
}: {
    children: ReactNode
}) {

    return (
        <>
        <Layout>
            <Card className="w-full md:w-3/4 h-full rounded-none border-none shadow-none">
                <CardHeader className="p-0 mb-4 flex flex-col items-center px-4">
                    <CardTitle className="text-4xl">Studio and Gear</CardTitle>
                    <CardDescription className="text-lg font-light">Quality makes all the difference.</CardDescription>
                </CardHeader>
                <div className="w-full mt-4 h-full">
                    <CardContent className="p-0 w-[100%] flex flex-col items-center mb-4">       
                        <div className="flex items-center w-2/3 px-4 h-2/3">
                            <GearImage />
                        </div>
                        <div className="px-4 my-4 text-xl font-thin my-8">
                            <p>
                                Lündhé Audio is equipped to handle almost any need or situation, with top-tier analog equipment, state of the art software, and an ever growing
                                catalogue of instruments and tools to make musical magic happen. We're not afraid blend cutting-edge music tech with old-school sonics and 
                                techniques to create something new. Here's what we use.
                            </p>
                        </div>
                        <Suspense fallback={<Loader/>}>
                            {children}
                        </Suspense>
                    </CardContent>
                </div>
            </Card>
        </Layout>
    </>
  );
}
