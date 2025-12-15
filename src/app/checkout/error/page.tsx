import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { AlertTriangle, Mail, RefreshCcw } from "lucide-react"
import Link from "next/link"

export default function ErrorPage() {
  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 !w-[24px] !h-[24px]rounded-full flex items-center justify-center">
              <AlertTriangle className="text-red-600" />
            </div>
            <CardTitle className="text-2xl">Payment Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center text-muted-foreground">
              <p>An error occurred while processing your payment. Your card has not been charged.</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-1 ">
              <div className="flex flex-col gap-1">
                <p className="font-medium flex gap-1">
                    <Mail className="!w-[16px] !h-[16px] text-muted-foreground mt-0.5" />
                    <span>Need help?</span>
                    </p>
                <p className="text-sm text-muted-foreground">
                  If this issue persists, please contact our support team at{" "}
                  <a href="mailto:info@lundhe.audio" className="text-primary hover:underline font-medium">
                    info@lundhe.audio
                  </a>
                </p>
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <Button asChild className="flex-1 border dark:border-white hover:bg-black dark:hover:bg-white dark:hover:text-black">
                <Link href="/checkout">
                  <RefreshCcw className="!w-[16px] !h-[16px] mr-2" />
                  Try Again
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 border dark:border-white hover:bg-black dark:hover:bg-white dark:hover:text-black">
                <Link href="/">Return Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
