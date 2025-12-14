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
            className={`text-xs align-middle rounded-xs px-2 py-1 border ${filters.includes(tag) ? 'text-cyan-500' : 'text-muted-foreground'} hover:text-cyan-500 hover:border-cyan-500 cursor-pointer`}
        >
            {tag}
        </Button>
    )
}