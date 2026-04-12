"use client";

import * as React from "react";
import { Copy, Loader2, Sparkles } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

export function CouponGenerator() {
  const [code, setCode] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const generate = api.adminCoupons.generate.useMutation({
    onMutate: () => {
      setError(null);
      setCopied(false);
    },
    onSuccess: ({ code: newCode }) => {
      setCode(newCode);
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

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
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

      <Button
        type="button"
        onClick={() => generate.mutate()}
        disabled={generate.isPending}
        className="self-start border rounded-sm"
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
    </div>
  );
}
