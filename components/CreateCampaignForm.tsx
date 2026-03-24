"use client";

import { createCampaign } from "@/app/actions/campaigns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateCampaignForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await createCampaign(formData);
    if ("error" in result) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.push(`/campaigns/${result.id}`);
    router.refresh();
    setPending(false);
  }

  return (
    <Card className="w-full max-w-lg shadow-md">
      <CardHeader>
        <CardTitle>New campaign</CardTitle>
        <CardDescription>
          Name is required. Client and brand are optional for now.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="campaign-name">Name</Label>
            <Input id="campaign-name" name="name" type="text" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-client">Client</Label>
            <Input id="campaign-client" name="client" type="text" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-brand">Brand</Label>
            <Input id="campaign-brand" name="brand" type="text" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Creating…" : "Create campaign"}
          </Button>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            Cancel
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
