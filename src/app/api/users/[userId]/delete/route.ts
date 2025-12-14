import { env } from '~/env'


import { NextRequest, NextResponse } from 'next/server'
 
export async function DELETE(_: NextRequest,  { params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params

    const headers = new Headers()
    headers.append("Authorization", `Bearer ${env.CLERK_SECRET_KEY}`)
    headers.append('Content-Type', 'application/json')

   
    

    return await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        method: "DELETE",
        headers: headers,
    })
        .then(_ => NextResponse.next({
            status: 204,
            
        }))
        .catch(_ => NextResponse.next({
            status: 500
        }))
}