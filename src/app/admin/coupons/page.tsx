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
          Create a unique, single-use coupon code.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New code</CardTitle>
          <CardDescription>
            Each click generates a fresh, non-reusable code stored in the
            coupons table.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CouponGenerator />
        </CardContent>
      </Card>
    </div>
  );
}
