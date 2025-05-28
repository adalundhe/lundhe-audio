import { BlogNavCard } from '~/components/blog/blog-nav-card';
import { BlogSearchBar } from '~/components/blog/blog-search-bar';
import { Layout } from '~/components/Layout';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle
} from "~/components/ui/card";
import { usePostsStore, type Blog } from '~/stores/posts-store';
import { useShallow } from 'zustand/react/shallow'



export default function Blog() {

    const {
        posts
    } = usePostsStore(useShallow((state) => ({
        posts: state.posts
    })))


    return (
        <>
            <Layout>
                <Card className="md:w-3/4 w-full h-full rounded-none border-none shadow-none">
                   <CardHeader className="p-0 mb-4 flex flex-col items-center px-4">
                        <CardTitle className="text-4xl">Blog</CardTitle>
                        <CardDescription className="text-lg font-light">The latest word from Lündhé Audio</CardDescription>
                    </CardHeader>
                    <BlogSearchBar/>
                    <div className="w-full mt-4 h-full flex flex-col items-center justify-center gap-4">
                        {
                            posts.map((post, idx) => (
                                <div key={`blog-${idx}-${post.date}`} className='mb-4 w-full'>
                                    <BlogNavCard
                                        title={post.title}
                                        description={post.description}
                                        link={post.link}
                                        date={post.date}
                                        tags={post.tags}
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