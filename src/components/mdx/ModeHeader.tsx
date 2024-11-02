import { ReactElement, useCallback } from "react"

export const ModeHeader = ({
    children
}: {
    children: ReactElement
}) => {

    // const {
    //     mode
    // } = useSiteSettings(
    //     useCallback((state) => ({
    //         mode: state.visibilityMode
    //     }), [])
    // )

    const mode = "light"
    
    return (
        <div className={`font-sans text-[4.5vmin] ${mode === 'light' ? 'text-[#212121]' : 'text-[#F5F5F5]'}`}>
            {children}
        </div>
    )
}