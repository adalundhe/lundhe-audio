import { Layout } from "~/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import type { Metadata } from 'next'
import { ServicesSection } from "../_components/services-section";

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
              <CardTitle className="text-2xl md:text-4xl">Mixing</CardTitle>
              <CardDescription>Making your sound the best it can be.</CardDescription>
          </CardHeader>
          <Separator className="w-full my-4" />
          <CardContent className="p-0 w-[100%] flex flex-col items-center mt-4">
            <div className="w-full text-xl font-thin">
              <p>
                At Lündhé Audio we offer world class post-tracking mixing, amplifying the vision behind the raw captures of your
                performances or rough sketches. We blend a mixture of classic and cutting-endge high-end hardware, industry standard
                software, and years of experience.
              </p>
              <p>
                Sessions are entirely remote, however (for an additional fee) artists may schedule virtual "in-person"
                sessions. We do not offer on-site sessions.
              </p>
            </div>
          </CardContent>
          <Separator className="w-full my-4"/>
          <CardContent className="p-0 w-full flex flex-col mt-4">
            <ServicesSection
              title="how it works"
              group="how-it-works"
            >
              <div className="w-full text-xl font-thin">
                <ul className="list-decimal list-outside pl-[revert]">
                  <li className="my-4">
                    <p className="text-md mb-4">Quote</p>
                    <p>
                      Before scheduling a mix slot, you will need to determine the project size and get an approved quote
                      from us. We recommend using the Quote Calculator above to calculate your session size and cost. Be
                      sure to include any custom options or add-ons in your quote, as we do not facilitate scope changes made to
                      accepted projects more than forty-eight hours prior to a scheduled slot.
                    </p>
                  </li>
                </ul>
              </div>
            </ServicesSection>
          </CardContent>
        </Card>
      </Layout>
    </>
  );
}
