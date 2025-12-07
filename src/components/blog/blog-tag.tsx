"use client"
import { Button } from '~/components/ui/button'
import { usePostsStore } from '~/stores/posts-store';
import { useShallow } from 'zustand/react/shallow'

export const BlogTag = ({
    tag,
}: {
    tag: string,
}) => {

    const {
        filters,
        update,
    } = usePostsStore(useShallow((state) => ({
        filters: state.filters,
        update: state.update,
    })))

    
    return (

        <Button
            onClick={() => update({
                type: 'filter',
                value: tag,
            })}
            className={`lg:text-[1vmax] md:text-[1.25vmax] text-[2vmax] rounded-xs md:w-[8vmax] md:w-[10vmax] w-[16vmax] lg:h-[2.5vmax] md:h-[2.5vmax] h-[5vmax] flex items-center justify-center border ${filters.includes(tag) ? 'text-cyan-500' : 'text-slate-500/90'} hover:text-cyan-500 hover:border-cyan-500 cursor-pointer`}
        >
            {tag}
        </Button>
    )
}