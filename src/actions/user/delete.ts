"use server"
import { auth } from "@clerk/nextjs/server"
import { env } from '~/env'

export const deleteAccount = async () => {
    const { userId } = await auth()
    if (!userId) {
        throw new Error("User must be authenticated to delete account")
    }

    const headers = new Headers()
    headers.append("Authorization", `Bearer ${env.CLERK_SECRET_KEY}`)
    headers.append('Content-Type', 'application/json')

    await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        method: "DELETE",
        headers: headers,
    })
}