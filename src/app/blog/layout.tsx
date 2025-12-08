import { ReactNode } from 'react';
import { Layout } from '~/components/Layout';
import {
    Card,
} from "~/components/ui/card";
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lündhé Audio | Blog',
  description: "Lündhé Audio, an Austin based post-tracking mixing, mastering, sound design, and commercial audio studio.",
  icons: [
    {
      rel: "icon",
      url: "/favicon.ico",
    }
  ],
}

export default  async function BlogLayout({
    children
}: {
    children: ReactNode
}) {
    return (
        <Layout>
            <Card className="md:w-3/4 w-full h-full rounded-none border-none shadow-none">
               {children}
            </Card>
        </Layout>
    )
}