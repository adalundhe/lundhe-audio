"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useClerk } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog"
import { User, Mail, Trash2, Loader2 } from "lucide-react"
import { Layout } from "~/components/Layout"

interface AccountDashboardProps {
  userId: string
  firstName: string | null
  lastName: string | null
  email: string | undefined
  imageUrl: string
}

export default function AccountDashboard() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { signOut, user } = useClerk()

  const fullName = user?.fullName ?? 'Unknown'

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/users/${user?.id}/delete`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete account")
      }

      await signOut()
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsDeleting(false)
    }
  }

  const firstInitial = user?.firstName?.at(0) ?? 'N/'
  const lastInital = user?.lastName?.at(0) ?? 'A'

  return (
    <Layout>
        <Card className="w-full md:w-3/4 h-3/4 rounded-none border-none shadow-none flex flex-col items-center justify-center gap-8">
            <Card className="w-full">
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.imageUrl || "/placeholder.svg"} alt={fullName} />
                    <AvatarFallback className="text-lg">{firstInitial}{lastInital}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-lg font-medium">{fullName}</p>
                    <p className="text-sm text-muted-foreground">Since {user?.createdAt?.toDateString()}</p>
                </div>
                </div>

                <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <User className="!w-[16px] !h-[16px] text-muted-foreground" />
                    <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{fullName}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Mail className="!w-[16px] !h-[16px] text-muted-foreground" />
                    <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.emailAddresses.at(0)?.emailAddress ?? "No email"}</p>
                    </div>
                </div>
                </div>
            </CardContent>
            </Card>

            {/* Danger Zone Card */}
            <Card className="border-red-500/50 w-full flex flex-col items-center justify-center">
            <CardHeader>
                <CardTitle className="text-red-500">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions for your account</CardDescription>
            </CardHeader>
            <CardContent>
                {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button className="w-full sm:w-auto border border-red-500 text-red-500 hover:bg-red-800/30">
                        <Trash2 className="!w-[16px] !h-[16px] mr-2" />
                        Delete Account
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all associated
                        data from our servers.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting} className="border dark:border-white hover:bg-black dark:hover:bg-white dark:hover:text-black">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="border border-red-500 text-red-500 hover:bg-red-800/30"
                    >
                        {isDeleting ? (
                        <>
                            <Loader2 className="!w-[16px] !h-[16px] mr-2 animate-spin" />
                            Deleting...
                        </>
                        ) : (
                            "Confirm"
                        )}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
            </CardContent>
            </Card>
        </Card>
    </Layout>
  )
}
