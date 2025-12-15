"use server"
import { auth } from "@clerk/nextjs/server"
import { env } from '~/env'
import { redirect } from "next/navigation"

export const deleteAccount = async () => {
    const { userId } = await auth()
    if (!userId) {
        redirect("/sign-in")
    }

    const headers = new Headers()
    headers.append("Authorization", `Bearer ${env.CLERK_SECRET_KEY}`)
    headers.append('Content-Type', 'application/json')

    try {
        await fetch(`https://api.clerk.com/v1/users/${userId}`, {
            method: "DELETE",
            headers: headers,
        })
    } catch (_) {
        console.error("User delete failed")
    }
}
