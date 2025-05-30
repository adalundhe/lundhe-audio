import { Spinner } from "~/components/ui/spinner";


export const Loader = () => <div className="w-full h-[600px] flex flex-col items-center justify-center">
    <div className="w-fit flex flex-col items-center justify-center space-y-4">
        <div>
            Loading...
        </div>
        <Spinner size="sm" className="bg-black/75 dark:bg-white/75" />
    </div>
</div>
