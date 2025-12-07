import type { MDXComponents } from 'mdx/types';
import { Pre } from '~/components/blog/pre';
 

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    pre: (props) => <Pre {...props} />,
    ...components,
  }
}