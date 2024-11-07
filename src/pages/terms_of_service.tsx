import { createElement, useEffect } from "react";
import { Layout } from "~/components/Layout";
import { Card, CardContent } from "~/components/ui/card";

const TermlyTermsOfService = () => {

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://app.termly.io/embed-policy.min.js";
        script.async = true;
        document.body.appendChild(script);
    }, []);

    return createElement('div', {
        name: 'termly-embed',
        className: "w-full h-full",
        'data-id': "abd6c341-fce5-4332-9def-55a6f96f71f1",
        'data-type': 'iframe'
      });
}


export default function TermsOfService(){

    return (
        <>
            <Layout>
                <Card className="w-full md:w-3/4 h-full rounded-none border-none shadow-none">
                    <CardContent className="p-0 w-[100%] h-full flex flex-col items-center">
                        <TermlyTermsOfService />
                    </CardContent>
                </Card>
            </Layout>
        </>
    )
}