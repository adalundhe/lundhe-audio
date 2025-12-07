import { Layout } from "~/components/Layout";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { ContactForm } from "./_components/contact-form";


import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lündhé Audio | Contact',
  description: "Lündhé Audio, an Austin based post-tracking mixing, mastering, sound design, and commercial audio studio.",
  icons: [
    {
      rel: "icon",
      url: "/favicon.ico",
    }
  ],
}

export default async function Contact(){
    
  return (
    <>
      <Layout>
        <Card className="w-full md:w-3/4 h-full rounded-none border-none shadow-none px-4 text-xl">
            <CardHeader className="p-0 flex flex-col items-center">
                <CardTitle className="w-3/4 text-4xl text-center">Get in touch!</CardTitle>
                <CardDescription className="text-center w-3/4 text-xl font-light">
                    Fill out the form below to reach out to us. We usually respond in one business day.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 w-[100%] flex flex-col items-center">
                <ContactForm />
            </CardContent>
        </Card>
      </Layout>
    </>
  );
}
