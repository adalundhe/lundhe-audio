import { useCallback, useEffect, useMemo, useState } from "react";
import { usePostsStore } from "~/utils/blog";
import {useSiteSettings } from "~/utils/settings"
import { Tag } from '~/types/blog'



export const SummaryTag = ({ tag }: {
    tag: string
}) => {

    const {
        mode
    } = useSiteSettings(
        useCallback((state) => ({
            mode: state.visibilityMode
        }), [])
    )

    const {
        tags,
        filter,
        filterMethod,
        sortMethod,
        sortOrder,
        setTagState
    } = usePostsStore((state) => ({
        tags: state.postTags,
        filterMethod: state.filterMethod,
        sortMethod: state.sortMethod,
        sortOrder: state.sortOrder,
        filter: state.filterSummaries,
        setTagState: state.setPostTagState
    }))

    const tagIdx = tags.map(postTag => postTag.tag).indexOf(tag)
    const tagState = tags.at(tagIdx)?.state || 'ready'


    return (
        <p></p>
    )
}