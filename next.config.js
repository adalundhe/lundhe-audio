/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import laserwave from 'shiki/themes/laserwave.mjs';

await import("./src/env.js");
Object.assign(process.env, { NEXT_TELEMETRY_DISABLED: '1' });

import createMDX from '@next/mdx';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';

const nextConfig = {
  pageExtensions: ['md', 'mdx', 'tsx', 'ts', 'jsx', 'js'],
  transpilePackages: ["geist"],
};

const options = {
  theme: laserwave,
};


const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [remarkParse, [rehypePrettyCode, options], rehypeSlug, rehypeStringify],
  },
})



export default withMDX(nextConfig)
