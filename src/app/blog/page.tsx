"use client"

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
            <div className='flex w-full justify-center'>
                <CardHeader className="md:w-full w-[90%] p-0 mb-4 flex flex-col items-center px-4">
                    <CardTitle className="text-4xl">Blog</CardTitle>
                    <CardDescription className="text-lg font-light text-center">The latest word from Lündhé Audio</CardDescription>
                </CardHeader>
            </div>
            <div className='flex w-full justify-center'>
                <BlogSearchBar/>
            </div>
            <div className='flex w-full justify-center'>
                <div className="md:w-full w-[90%] mt-4 h-full flex flex-col items-center justify-center gap-4">
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
            </div>
        </>
    )
}