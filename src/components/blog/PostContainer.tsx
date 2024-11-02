import { ModeText, ModeHeader } from '~/components/mdx'  
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'

export const PostContainer = ({
    mdx
}: {
    mdx: MDXRemoteSerializeResult
}) => <div>
   <MDXRemote  {...mdx} components={{
        'ModeText': ModeText,
        'ModeHeader': ModeHeader
    }}/>
</div>