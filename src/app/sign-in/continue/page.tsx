'use client'

import { useState } from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'
import { ScaleLoader } from '~/components/ui/scale-loader'

export default function SignInContinuePage() {
  const router = useRouter()
  // Use `useSignUp()` hook to access the `SignUp` object
  // `missing_requirements` and `missingFields` are only available on the `SignUp` object
  const { isLoaded, signUp, setActive } = useSignUp()
  const [formData, setFormData] = useState<Record<string, string>>({})

  if (!isLoaded){
    return (
      <ScaleLoader/>
    )
  }

//   // Protect the page from users who are not in the sign-up flow
//   // such as users who visited this route directly
  if (!signUp.id) router.push('/sign-in')

  const status = signUp?.status
  const missingFields =  signUp?.missingFields ?? []

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


  return (
    isLoaded && status === "missing_requirements" ?
    (
      <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
        {missingFields.map((field) => (
            <div key={field} className='space-y-2 text-sm flex flex-col gap-1'>
            <Label className='required'>
            {field}:
            </Label>
            <Input
                type={field === 'email_address' ? 'email' : field === 'password' ? 'password' : field === 'phone_number' ? 'tel' : 'text'}
                value={formData[field] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
                required
                className='border border-muted-foreground field'
            />
            </div>
        ))}

        {/* Required for sign-up flows
        Clerk's bot sign-up protection is enabled by default */}
        <div id="clerk-captcha" />

        <div className='w-full flex items-center justify-center mt-4'>
          <button type="submit" className='px-4 py-2 border dark:border-white rounded-sm hover:border-cyan-400 hover:text-cyan-500'>Submit</button>
        </div>
      </form>
    ) : status === 'complete'
    ? <div>
      Sign up complete!
    </div>
    : <div>
      Invalid request.
    </div> 
  )


}