import { Layout } from "~/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { HomeCarousel } from "./_components/home-carousel";
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lündhé Audio | Home',
  description: "Lündhé Audio, an Austin based post-tracking mixing, mastering, sound design, and commercial audio studio.",
  icons: [
    {
      rel: "icon",
      url: "/favicon.ico",
    }
  ],
}

export default async function Home() {

  return (
    <>
      <Layout>
        <Card className="w-full md:w-3/4 h-3/4 rounded-none border-none shadow-none flex flex-col items-center justify-center">
          <CardHeader className="flex justify-center items-center p-0">
              <CardTitle className="text-2xl md:text-4xl">Lündhé Audio</CardTitle>
              <CardDescription>Sound as it should be.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 w-[100%] flex flex-col items-center mb-4">
              <HomeCarousel />
          </CardContent>
          <Separator className="w-1/2" />
          <CardContent className="p-0 w-[100%] flex flex-col items-center mt-4">
            <div className="w-3/4 text-xl font-thin text-center">
              <p>
                Lündhé Audio is a privately owned and operated mixing and mastering studio out of Austin, Texas.
              </p>
              <br/>
              <p>
                Targeted towards post-tracking mixing, mastering, commercial audio, post-production, and sound design - Lündhé Audio blends top-shelf analog, 
                cutting edge digital, and over fifteen years of experience to bring the creative vision of clients to life with world class quality.
              </p>
              <br/>
              <p>
                Lündhé Audio also develops proprietary DSP technologies for processing, analyzing, and generating with sound. We create tools that emphasize
                creativity and simplicity while pushing the limits of efficiency and musicality.
              </p>
            </div>
          </CardContent>
        </Card>
      </Layout>
    </>
  );
}
