"use client"
import { usePostsStore } from '~/lib/stores/posts-store';
import { useShallow } from 'zustand/react/shallow'
import { Button } from '~/components/ui/button'
import {
   Search
} from 'lucide-react'
import { BlogSortIcon } from './blog-sort-icon';
import { Input } from "~/components/ui/input"

export const BlogSearchBar = () => {

       const {
        update,
        direction,
        field,
        query,
    } = usePostsStore(useShallow((state) => ({
        update: state.update,
        direction: state.direction,
        field: state.field,
        query: state.query,
    })))

    return (
        <div className="2xl:w-3/4 w-full flex items-center md:gap-4 gap-2 my-2">
            <Button
                className='p-0 justify-self-start border rounded-sm px-2 py-2 text-sm hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
                onClick={() => update({
                        type: 'sort',
                        value: direction === 'ASC' ? 'DESC' : 'ASC',
                        field: field
                    })
                }
            >
                <BlogSortIcon 
                    styles='!w-[16px] !h-[16px]'
                    direction={direction}
                    field={field}
                />
            </Button>
            <Button
                className='p-0 justify-self-start px-2 py-2 border rounded-sm text-sm hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
                onClick={() => update({
                        type: 'sort',
                        value: direction,
                        field: field === 'date' ? 'title' : 'date'
                    })
                }
            >
                {field === 'title' ? 'Title' : 'Date'}
            </Button>
            <div className='w-full flex flex-col justify-center'>
                <div className='flex h-full w-full justify-end gap-2 items-center'>
                    <div>
                        <Search
                            className='!w-[16px] !h-[16px]'
                        />
                    </div>
                    <Input value={query} className='text-sm h-full md:w-1/4 w-1/2 py-2' onChange={(e) => update({
                        type: 'search',
                        value: e.target.value,
                    })} />
                </div>
            </div>
        </div>
    )
}