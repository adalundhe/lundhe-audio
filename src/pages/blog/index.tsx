import { Layout } from "~/components/Layout";
import { Card, CardContent } from "~/components/ui/card";
import { Suspense } from 'react'



export default function Blog(){

    return (
        <>
            <Layout>
                <Card className="w-full md:w-3/4 h-full rounded-none border-none shadow-none">
                    <CardContent className="p-0 w-[100%] h-full flex flex-col items-center">
                        
                    </CardContent>
                </Card>
            </Layout>
        </>
    )
}