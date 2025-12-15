import SignInContinuePage from "./page"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Layout } from "~/components/Layout";
import { Suspense } from "react";
import SignInContinueLoading from "./loading";

export default async function SignInContinueLayout() {


    return (   
        <Layout>
            <Card className="w-full md:w-3/4 h-full rounded-none border-none shadow-none flex flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center border rounded-sm mt-8 mb-4 2xl:w-1/3 xl:w-1/2 lg:w-3/4 w-full rounded-sm border">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">Continue sign-up</CardTitle>
                        <CardDescription>Finish setting up your account</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <Suspense fallback={<SignInContinueLoading/>}>
                            <SignInContinuePage/>
                        </Suspense>
                    </CardContent>
                </div>
            </Card>
        </Layout>
    )
}
