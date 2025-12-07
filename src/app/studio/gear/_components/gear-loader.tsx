"use client"
import { GearDisplay } from '~/components/GearDisplay'
import { Loader } from '~/components/Loader'
import { Suspense } from "react";


export const GearLoader = () => <Suspense fallback={<Loader/>}>
                            <GearDisplay/>
                        </Suspense>