import { env } from '~/env'


import type { NextApiRequest, NextApiResponse } from 'next'
 
type ResponseData = {
  message: string
}

function userIdIsString(userId: string | string[] | undefined): userId is string {
    return userId?.toString !== undefined
}
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {

    if (req.method === "DELETE") {

        const { userId } = req.query

        if (!userIdIsString(userId)){
            return res.status(400).json({message:"Invalid userId"})
        }

        const headers = new Headers()
        headers.append("Authorization", `Bearer ${env.CLERK_SECRET_KEY}`)
        headers.append('Content-Type', 'application/json')
        

        return await fetch(`https://api.clerk.com/v1/users/${userId}`, {
            method: "DELETE",
            headers: headers,
        })
            .then(_ => res.status(200).json({ message: 'OK' }))
            .catch(_ => res.status(500))
        

    }

    return res.status(405)
  
}