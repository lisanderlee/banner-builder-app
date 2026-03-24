import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { CampaignRow } from "@/types/campaign";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function CampaignWorkspacePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !campaign) {
    notFound();
  }

  const c = campaign as CampaignRow;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-fit px-0"
          )}
        >
          ← Campaigns
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {c.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {c.client && `${c.client}`}
          {c.client && c.brand ? " · " : ""}
          {c.brand && `${c.brand}`}
        </p>
      </header>

      <Card className="border-dashed shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-medium">Workspace</CardTitle>
          <CardDescription>
            Deliverables and assets arrive in{" "}
            <span className="font-medium text-foreground">Phase 2</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" disabled>
            Coming soon
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
