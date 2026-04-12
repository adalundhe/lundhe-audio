"use client";

import * as React from "react";
import { Copy, Loader2, Save, Sparkles } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";

const COUPON_TYPES = [
  { value: "flat", label: "Flat amount" },
  { value: "percentage", label: "Percentage" },
] as const;

export function CouponGenerator() {
  const [code, setCode] = React.useState<string>("");
  const [couponType, setCouponType] = React.useState<"flat" | "percentage">(
    "flat",
  );
  const [amount, setAmount] = React.useState("0");
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const parsedAmount = Number(amount);
  const isAmountValid = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const canSave = code.trim() !== "" && isAmountValid;

  const generate = api.adminCoupons.generate.useMutation({
    onMutate: () => {
      setError(null);
      setSuccess(null);
      setCopied(false);
    },
    onSuccess: ({ code: newCode }) => {
      setCode(newCode);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const createCoupon = api.adminCoupons.create.useMutation({
    onMutate: () => {
      setError(null);
      setSuccess(null);
    },
    onSuccess: ({ code: savedCode }) => {
      setSuccess(`Saved coupon ${savedCode}.`);
      setCode("");
      setCopied(false);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied or unavailable — silently no-op.
    }
  };

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    createCoupon.mutate({
      code,
      couponType,
      amount: Number(parsedAmount.toFixed(2)),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-md border border-green-600/40 bg-green-600/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          {success}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="coupon-type">Coupon Type</Label>
          <Select
            value={couponType}
            onValueChange={(value: "flat" | "percentage") =>
              setCouponType(value)
            }
          >
            <SelectTrigger id="coupon-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUPON_TYPES.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="coupon-amount">
            Amount {couponType === "percentage" ? "(%)" : "(USD)"}
          </Label>
          <Input
            id="coupon-amount"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          readOnly
          value={code}
          placeholder="No code generated yet"
          aria-label="Generated coupon code"
          className="font-mono text-sm tracking-widest"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleCopy}
          disabled={!code}
          aria-label="Copy code to clipboard"
        >
          <Copy className="!h-[16px] !w-[16px]" />
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="border rounded-sm"
        >
          {generate.isPending ? (
            <>
              <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 !h-[16px] !w-[16px]" />
              Generate Code
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleSave}
          disabled={!canSave || createCoupon.isPending}
          className="border rounded-sm"
        >
          {createCoupon.isPending ? (
            <>
              <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 !h-[16px] !w-[16px]" />
              Save Coupon
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
