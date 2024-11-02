
export type Summary = {
    date: Date;
    summary: string;
    title: string;
    tags: Array<string>;
    slug: string;
}

export type Tag = {
    tag: string;
    state: 'active' | 'ready';
}