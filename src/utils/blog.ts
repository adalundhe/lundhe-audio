import { create } from 'zustand'
import { Summary, Tag } from "~/types/blog"


type PostsStore = {
    postTags: Tag[];
    filterMethod: 'name-and-tag' | 'name-only' | 'tag-only';
    sortMethod: 'date' | 'name';
    sortOrder: 'asc' | 'desc';
    summaries: Summary[];
    filteredSummaries: Summary[];
    setPostTagState: (postTag: Tag) => void;
    setSummaries: (
        summaries: Summary[]
    ) => void;
    filterSummaries: (
        query: string,
        method: 'name-and-tag' | 'name-only' | 'tag-only',
        sortMethod: 'date' | 'name',
        sortOrder: 'asc' | 'desc'
    ) => void;
    sortSummaries: (
        method: 'date' | 'name',
        order: 'asc' | 'desc'
    ) => void;
}

const sortByName = (
    unfiltered: Summary[],
    direction: 'asc' | 'desc'
) => unfiltered.sort((
    postA,
    postB
) => {
    if(postA.slug < postB.slug) { 
        return direction === 'asc' ? -1 : 1 ; 
    }
    
    if(postA.slug > postB.slug) { 
        return direction === 'asc' ? 1 : -1; 
    }

    return 0;
    
})

const sortByDate = (
    unfiltered: Summary[],
    direction: 'asc' | 'desc'
) =>  unfiltered.sort((
    postA,
    postB
) => direction === 'asc' ? postA.date.getTime() - postB.date.getTime() : postB.date.getTime() - postA.date.getTime())


export const usePostsStore = create<PostsStore>((set, get) => ({
    postTags: [],
    filterMethod: 'name-and-tag',
    sortMethod: 'date',
    sortOrder: 'desc',
    summaries: [],
    filteredSummaries: [],
    setPostTagState(postTag: Tag){

        const { postTags } = get();
        const tagIdx = postTags.map(postTag => postTag.tag).indexOf(postTag.tag);

        set({
            postTags: postTags.map((tag, idx) => {

                if (tagIdx === idx){
                    return postTag
                }

                tag.state = 'ready'

                return tag


            })
        })

    },
    setSummaries(summaries: Summary[]){
        const tags = summaries.reduce((tags, summary) => tags.concat(summary.tags), [] as string[])
        set({
            summaries,
            postTags: [...new Set(tags)].map(
                tag => ({
                    tag,
                    state: 'ready'
                })
            ) as Tag[],
            filteredSummaries: summaries
        })
    },
    filterSummaries(
        query, 
        method,
        sortMethod,
        sortOrder
    ){
        const { summaries } = get()

        if (query.length < 1){
            set({
                filteredSummaries: summaries
            })
        }

        const matches: {
            [key: string]: Summary 
        } = {}


       if (method === 'name-and-tag' || method === 'name-only' ){
            summaries.forEach(
                post =>{

                    const hasNameMatch = post.title.toLowerCase().includes(
                        query.trim().toLowerCase()
                    )

                    if (hasNameMatch){
                        matches[post.slug] = post
                    }

                }
            )
       }

       if (method === 'name-and-tag' || method === 'tag-only'){
        summaries.forEach(
                post => {

                    const hasTagMatch = post.tags.filter(
                        tag => tag.toLowerCase().includes(
                            query.trim().toLowerCase()
                        )
                    ).length > 0

                    if (hasTagMatch){
                        matches[post.slug] = post
                    }

                }
            )
        
       }

       const matchedValues = Object.values(matches)

       sortMethod === 'date' ? set({
            filteredSummaries: sortByDate(
                matchedValues,
                sortOrder
            ),
            filterMethod: method
        }) : set({
            filteredSummaries: sortByName(
                matchedValues,
                sortOrder
            )
        })

    },
    sortSummaries(
        method,
        order
    ){
        const { filteredSummaries, summaries } = get()

        method === 'date' ? set({
            summaries: sortByDate(
                summaries,
                order
            ),
            filteredSummaries: sortByDate(
                filteredSummaries,
                order
            ),
            sortMethod: method,
            sortOrder: order
        }) : set({
            summaries: sortByName(
                summaries,
                order
            ),
            filteredSummaries: sortByName(
                filteredSummaries,
                order
            ),
            sortMethod: method,
            sortOrder: order
        })
        
    }
}))


type PostsSearchStore = {
    sortBy: 'date' | 'name';
    sortOrder: 'asc' | 'desc';
    setOrderAndMethod: (
        order: 'asc' | 'desc',
        method: 'date' | 'name'
    ) => void
}

export const usePostsSearchStore = create<PostsSearchStore>((set) => ({
    sortBy: 'date',
    sortOrder: 'desc',
    setOrderAndMethod(
        order,
        method
    ){
        set({
            sortOrder: order,
            sortBy: method
        })
    }
}))