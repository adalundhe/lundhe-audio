import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import postsData from "~/data/posts.json";


export type SortField = 'title' | 'date'
export type SortDirection = 'ASC' | 'DESC'

export type Blog = {
    title: string
    link: string
    description: string
    date: string
    tags: string[]
}


export type FilteredPosts = {
    activeFilter: string
    posts: Blog[]
}

type Operation = 'filter' | 'sort' | 'search'

type Update = {
    type: Operation
    value: string
    field?: SortField
}

interface PostsState {
    posts: Blog[]
    operations: Operation[]
    filters: string[]
    direction: SortDirection
    field: SortField
    query: string
    update: (operation: Update) => void
}

const filterPosts = ({
    posts,
    filters,
    query
}: {
    posts: Blog[],
    filters: string[],
    query?: string,
    
}) => {

    let filtered = filters.length > 0 ? posts.filter(post => filters.filter(
            filter => post.tags.includes(filter)
        ).length > 0) : posts

    if (query !== undefined) {
        const searchTerm = query.toLowerCase()
        filtered = query.length > 0 ? posts.filter(post => post.title.toLowerCase().includes(searchTerm) || post.description.toLowerCase().includes(searchTerm)) : filtered
    }


    return {
        posts: filtered,
        filters: filters,
        query: query ?? ''
    }
}

const sortPost = (postA: Blog, postB: Blog, field: SortField) => {
    switch (field) {
        case 'title':
            return postA[field].localeCompare(postB[field])
        case 'date':
            return Date.parse(postA[field]) - Date.parse(postB[field])
        default:
            return 0
    }

}


const sortPosts = ({
    posts,
    direction,
    field,
}: {
    posts: Blog[],
    direction: SortDirection,
    field: SortField,
}) => ({
        posts: [...direction == 'ASC' ? posts.sort((a, b) => sortPost(a, b, field)) : posts.sort((a, b) => sortPost(a, b, field)).reverse()],
        direction: direction,
        field: field,
    })




export const usePostsStore = create<PostsState>()(
    persist(
        (set, get) => ({
            posts: postsData as Blog[],
            filters: [],
            operations: [],
            direction: "DESC",
            field: "date",
            query: "",
            update: (update: Update) => {



                const operations = get().operations
                operations.push(update.type)

                const filters = get().filters
                if (update.type === 'filter' && !filters.includes(update.value)){
                    filters.push(update.value)
                } else if (update.type === 'filter') {
                    filters.splice(
                        filters.indexOf(update.value),
                        1
                    )
                }

                let direction = get().direction
                if (update.type === 'sort') {
                    direction = update.value as SortDirection
                }

                const posts = postsData;
                const query = get().query
                let state = filterPosts({
                    posts: posts,
                    filters: filters,
                    query: update.type === 'search' ? update.value : query
                }) 

             
                
                const field = update.field ?? get().field
                state = {
                    ...state,
                    ...sortPosts({
                        posts: state.posts,
                        direction: direction,
                        field: field,
                    })
                }

                set(() => (state))

            },
        }),
        {
            name: 'posts-storage'
        }
    )
)