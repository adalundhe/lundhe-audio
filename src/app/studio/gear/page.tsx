import { GearDisplay } from '~/components/GearDisplay'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lündhé Audio | Gear',
  description: "Lündhé Audio, an Austin based post-tracking mixing, mastering, sound design, and commercial audio studio.",
  icons: [
    {
      rel: "icon",
      url: "/favicon.ico",
    }
  ],
}

export default async function StudioPage() {

    return (
        <GearDisplay/>
  );
}
