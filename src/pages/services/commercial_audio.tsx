import { useRouter } from "next/router";
import { useEffect } from "react";
import { Layout } from "~/components/Layout"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"

export default function CommercialAudioService() {

    const router = useRouter()

    useEffect(() => {   
        router.back()
    }, )

    return (
    <>
        <Layout>
        <Card className="w-full lg:w-3/4 h-full rounded-none border-none shadow-none">
            <CardContent className="p-0 w-[100%] flex flex-col items-center">
                <div className="w-3/4 h-full">
                    <CardHeader className="p-0 pb-4 w-full flex flex-col">
                        <CardTitle className="text-2xl lg:text-4xl">Commercial Audio</CardTitle>
                        <CardDescription>(We do it well)</CardDescription>
                    </CardHeader>
                    <div className="pt-4">
                        <p>        
                            Lündhé Audio was founded in 2024 by long-time sound designer and engineer Ada Lundhe after 
                            over fifteen years of providing mixing, mastering, commercial audio, and sound-design services.
                        </p>
                        <br/>
                        <p>
                        Lündhé Audio is more than just a remote mixing and mastering facility - it's place where sound is 
                        pushed to the limits. We develop cutting edge DSP and software, create sound libraries and instruments
                        to inspire creativity, and blend the best of analog with the latest in digital to accomplish the impossible. 
                        </p>
                    </div>
                    <div className="w-full flex justify-center">   
                        <Separator className="w-3/4 my-8"/>
                    </div>
                    <CardHeader className="p-0 pb-4 w-full flex flex-col items-end">
                        <CardTitle className="text-2xl lg:text-4xl">Why we do it...</CardTitle>
                        <CardDescription>(Sound is everything)</CardDescription>
                    </CardHeader>
                    <div className="pt-4">
                            <p>        
                                Lündhé Audio is a passion project borne out of a love for everything sound. Whether a product of field recordings, 
                                beloved traditional instruments, or wild modular synthesis - we love making noise and helping others fall in love 
                                with it too.
                            </p>
                            <br/>
                            <div>
                                <p>
                                    <b>Nothing is off limits.</b>
                                </p>
                                <p>If taking a chance might create something special, it's worth doing. </p>
                            </div>
                            <br/>
                            <div>
                                <p>
                                    <b>Anything worth doing is worth doing well.</b>
                                </p>
                                <p>
                                    We take quality seriously, and it shows in everything we do - from the equipment we 
                                    use to the time we lavish on any project.
                                </p>
                            </div>
                            <br/>
                            <div>
                                <p>
                                    <b>Having fun is the key.</b>
                                </p>
                                <p>
                                    Every element of music is fundamentally rooted in creativity and the human spirit, 
                                    and it should spark joy not in both the listener <i>and</i> those that create it.
                                </p>
                            </div>
                        </div>
                </div>
                
            </CardContent>
        </Card>
        </Layout>
    </>
    );
}
