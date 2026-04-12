import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

import { CouponGenerator } from "./_components/coupon-generator";

export default function AdminCouponsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
        <h1 className="text-2xl font-semibold">Generate Coupon</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Generate a unique, single-use coupon code and save it when the details
          are ready.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New code</CardTitle>
          <CardDescription>
            Choose the coupon type and amount, generate a code, then save it to
            the coupons table when you are ready.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CouponGenerator />
        </CardContent>
      </Card>
    </div>
  );
}
