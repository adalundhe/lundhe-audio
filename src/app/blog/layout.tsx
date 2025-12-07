import { ReactNode } from 'react';
import { Layout } from '~/components/Layout';
import {
    Card,
} from "~/components/ui/card";


export default function BlogLayout({
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