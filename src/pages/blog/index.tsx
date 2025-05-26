import { BlogNavCard } from '~/components/blog/blog-nav-card';
import { Layout } from '~/components/Layout';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle
} from "~/components/ui/card";
import posts from "~/data/posts.json";


type Blog = {
    title: string
    link: string
    description: string
    date: string
}


export default function Blog() {

    const postData = posts as Blog[];

    return (
        <>
            <Layout>
                <Card className="w-full md:w-3/4 h-full rounded-none border-none shadow-none">
                   <CardHeader className="p-0 mb-4 flex flex-col items-center px-4">
                        <CardTitle className="text-4xl">Blog</CardTitle>
                        <CardDescription className="text-lg font-light">Because we love the 00s too.</CardDescription>
                    </CardHeader>
                    <div className="w-full mt-4 h-full">
                        {
                            postData.map((post, idx) => (
                                <div key={`blog-${idx}-${post.date}`}>
                                    <BlogNavCard
                                        title={post.title}
                                        description={post.description}
                                        link={post.link}
                                        date={post.date}
                                    />
                                </div>
                            )
                        )
                        }
                    </div>
                </Card>
            </Layout>
        </>
    )
}