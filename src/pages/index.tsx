import { Layout } from "~/components/Layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel"
import { AspectRatio } from "~/components/ui/aspect-ratio"
import Image from "next/image";
import { useMemo } from "react";

export default function Home() {

  const images: {
    src: string,
    altTxt: string
  }[] = useMemo(() => [
    {
      src: "/studio/under_desk_gear.jpg",
      altTxt: "A photo of Lundhe Audio's analog equipment - including Retro Instruments, Buzz Audio, Empirical Labs, Manley, and more."
    },
    {
      src: "/studio/chandler_redd_mic.jpg",
      altTxt: "A photo of Lundhe Audio's Chandler REDD mic."
    },
    {
      src: "/studio/grp_a4.jpg",
      altTxt: "A photo of Lundhe Audio's GRP A4 synth."
    },
    {
      src: "/studio/modular_01.jpg",
      altTxt: "A photo of one of many of Lundhe Audio's Eurorack synthesizers."
    },
    {
      src: "/studio/moog_and_pedals.jpg",
      altTxt: "A photo of Lundhe Audio's Moog Model D and two Chase Bliss pedals."
    }
  ], [])

  return (
    <>
      <Layout>
        <Card className="w-full md:w-3/4 h-3/4 rounded-none border-none shadow-none flex flex-col items-center justify-center">
        <CardHeader className="flex justify-center items-center p-0 pb-4">
            <CardTitle className="text-2xl md:text-4xl">Lundhe Audio</CardTitle>
            <CardDescription>Sound as it should be.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 w-[100%] flex flex-col items-center">
          <Carousel className="w-3/4 h-3/4">
            <CarouselContent>
              {images.map((image, index) => (
                <CarouselItem key={`studio_image_${index}`} className="flex items-center justify-center w-full">
                    
                  <AspectRatio ratio={4 / 3} className="flex items-center justify-center my-4 ">
                      <Image
                          src={image.src}
                          alt={image.altTxt}
                          width="0"
                          height="0"
                          sizes="100vw"
                          className="w-3/4 h-full"
                      />
                  </AspectRatio>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </CardContent>
        <CardContent className="p-0 w-[100%] flex flex-col items-center">
          <div className="w-3/4 pt-4">
            Lundhe Audio is a privately owned and operated mixing and mastering studio out of Austin, Texas. Targeted towards post-tracking mixing, mastering, commercial audio, post-production, and sound design - Lündhé Audio blends top-shelf analog, cutting edge digital, and over fifteen years of experience to bring the creative vision of clients to life with world class quality.
          </div>
        </CardContent>
        </Card>
      </Layout>
    </>
  );
}
