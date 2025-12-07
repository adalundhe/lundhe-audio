"use client"
import { ScaleLoader } from "~/components/ui/scale-loader"


export default function Loader() {
    return (
        <div className="w-full h-[600px] flex flex-col items-center justify-center">
            <div className="w-fit flex flex-col items-center justify-center space-y-4">
                <div className="text-center w-full">
                    Loading
                </div>
                <ScaleLoader />
            </div>
        </div>
    )
} 
