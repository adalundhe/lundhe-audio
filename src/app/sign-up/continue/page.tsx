'use client'

import { useState } from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Layout } from "~/components/Layout";
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'

export default function Page() {
  const router = useRouter()
  // Use `useSignUp()` hook to access the `SignUp` object
  // `missing_requirements` and `missingFields` are only available on the `SignUp` object
  const { isLoaded, signUp, setActive } = useSignUp()
  const [formData, setFormData] = useState<Record<string, string>>({})

  if (!isLoaded) return <div>Loading…</div>

  // Protect the page from users who are not in the sign-up flow
  // such as users who visited this route directly
  if (!signUp.id) router.push('/sign-in')

  const status = signUp?.status
  const missingFields = signUp?.missingFields ?? []

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Update the `SignUp` object with the missing fields
      // The logic that goes here will depend on your instance settings
      // E.g. if your app requires a phone number, you will need to collect and verify it here
      const res = await signUp?.update(formData)
      if (res?.status === 'complete') {
        await setActive({
          session: res.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              // Check for tasks and navigate to custom UI to help users resolve them
              // See https://clerk.com/docs/guides/development/custom-flows/overview#session-tasks
              console.log(session?.currentTask)
              router.push('/sign-in/tasks')
              return
            }

            router.push('/')
          },
        })
      }
    } catch (err) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  if (status === 'missing_requirements') {
    // For simplicity, all missing fields in this example are text inputs.
    // In a real app, you might want to handle them differently:
    // - legal_accepted: checkbox
    // - username: text with validation
    // - phone_number: phone input, etc.
    return (
    <Layout>
        <Card className="w-full md:w-3/4 h-full rounded-none border-none shadow-none flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center border rounded-sm mt-8 mb-4 h-[500px]">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Continue sign-up</CardTitle>
                    <CardDescription>Finish setting up your account</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <form onSubmit={handleSubmit}>
                    {missingFields.map((field) => (
                        <div key={field} className='space-y-2'>
                        <Label>
                        {field}:
                        </Label>
                        <Input
                            type="text"
                            value={formData[field] || ''}
                            onChange={(e) => handleChange(field, e.target.value)}
                            required
                        />
                        </div>
                    ))}

                    {/* Required for sign-up flows
                    Clerk's bot sign-up protection is enabled by default */}
                    <div id="clerk-captcha" />

                    <button type="submit">Submit</button>
                    </form>
                </CardContent>
            </div>
        </Card>
    </Layout>
    )
  }

  // Handle other statuses if needed
  return (
    <>
      {/* Required for sign-up flows
      Clerk's bot sign-up protection is enabled by default */}
      <div id="clerk-captcha" />
    </>
  )
}