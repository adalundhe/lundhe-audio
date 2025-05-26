export const Paragraph = ({
    children,
    side = 'justify'
}: {
    children: string,
    side: 'left' | 'center' | 'right' | 'justify'
}) => <div className={`w-full text-[1.5vmax] mb-4 ${
    side === 'left' ? 'text-left' :  
    side == 'center' ? 'text-center' : 
    side == 'justify' ? 'text-justify' : 'text-right'}`}>
    {children}
</div>