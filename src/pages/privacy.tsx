import { createElement, useEffect } from "react";
import { Layout } from "~/components/Layout";
import { Card, CardContent } from "~/components/ui/card";

const TermlyPrivacyContent = () => {

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://app.termly.io/embed-policy.min.js";
        script.async = true;
        document.body.appendChild(script);
    }, []);

    return createElement('div', {
        name: 'termly-embed',
        className: "w-full h-full",
        'data-id': "ae423e99-f627-4e8a-bccb-728f87320370",
        'data-type': 'iframe'
      });
}


export default function Privacy(){

    return (
        <>
            <Layout>
                <Card className="w-full md:w-3/4 h-full rounded-none border-none shadow-none">
                    <CardContent className="p-0 w-[100%] h-full flex flex-col items-center">
                        <TermlyPrivacyContent />
                    </CardContent>
                </Card>
            </Layout>
        </>
    )
}