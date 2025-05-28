
import { usePostsStore, type Blog } from '~/stores/posts-store';
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
        <div className="w-full flex items-center md:gap-4 gap-2 h-[4vmax] mb-4">
            <Button
                className='p-0 justify-self-start'
                onClick={() => update({
                        type: 'sort',
                        value: direction === 'ASC' ? 'DESC' : 'ASC',
                        field: field
                    })
                }
            >
                <div className='border rounded-sm px-2 py-2 md:h-[3vmax] h-[4vmax] md:w-[3vmax] w-[4vamx] md:min-w-[3vmax] min-w-[4vmax] md:min-h-[3vmax] min-h-[4vmax] flex items-center justify-center'>
                    <BlogSortIcon 
                        styles='md:w-[1.5vmax] w-[2vmax] md:h-[1.5vmax] h-[2vmax]'
                        direction={direction}
                        field={field}
                    />
                </div>
            </Button>
            <Button
                className='p-0 justify-self-start'
                onClick={() => update({
                        type: 'sort',
                        value: direction,
                        field: field === 'date' ? 'title' : 'date'
                    })
                }
            >
                <div className='border rounded-sm px-2 py-2 md:h-[3vmax] h-[4vmax] md:w-[6vmax] w-[8vmax] md:min-w-[6vmax] min-w-[8vmax] md:min-h-[3vmax] min-h-[4vmax] flex items-center justify-center md:text-[1.5vmax] text-[2vmax] '>
                    {
                        field === 'title' ? 'Title' : 'Date'
                    }
                </div>
            </Button>
            <div className='w-full flex flex-col md:h-[3vmax] h-[4vmax] md:max-h-[3vmax] max-h-[4vmax] justify-center'>
                <div className='flex md:h-[2vmax] h-full w-full justify-end gap-2 items-center'>

                    <div>
                        <Search
                            className='md:w-[1.5vmax] w-[2vmax] md:h-[1.5vmax] h-[2vmax]'
                        />
                    </div>
                    <Input value={query} className='md:text-[1.5vmax] text-[1vmax] h-full md:w-1/4 w-1/2 py-2' onChange={(e) => update({
                        type: 'search',
                        value: e.target.value,
                    })} />
                </div>
            </div>
        </div>
    )
}