import { CampaignStatusActions } from "@/components/CampaignStatusActions";
import { SignOutButton } from "@/components/SignOutButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { CampaignRow } from "@/types/campaign";
import Link from "next/link";

type SearchParams = { status?: string };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const statusFilter = params.status ?? "active";
  const supabase = await createClient();

  let query = supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (statusFilter === "active" || statusFilter === "archived") {
    query = query.eq("status", statusFilter);
  }

  const { data: campaigns, error } = await query;

  const list = (campaigns ?? []) as CampaignRow[];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Campaigns
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage HTML5 and static banner campaigns.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/campaigns/new"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            New campaign
          </Link>
          <SignOutButton />
        </div>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <FilterLink
          href="/?status=all"
          label="All"
          active={statusFilter === "all"}
        />
        <FilterLink
          href="/?status=active"
          label="Active"
          active={statusFilter === "active"}
        />
        <FilterLink
          href="/?status=archived"
          label="Archived"
          active={statusFilter === "archived"}
        />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {list.length === 0 && !error ? (
        <Card className="border-dashed shadow-none">
          <CardHeader className="text-center">
            <CardTitle className="text-base font-medium">
              No campaigns yet
            </CardTitle>
            <CardDescription>
              Create a campaign to start defining banner sizes and assets.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Link
              href="/campaigns/new"
              className={cn(buttonVariants({ variant: "secondary" }))}
            >
              New campaign
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="gap-0 overflow-hidden p-0 py-0 shadow-md">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="hidden sm:table-cell">Brand</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deliverables</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.client || "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {c.brand || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={c.status === "active" ? "default" : "secondary"}
                      className={
                        c.status === "active"
                          ? "bg-emerald-600/15 text-emerald-900 hover:bg-emerald-600/20 dark:bg-emerald-500/20 dark:text-emerald-100 dark:hover:bg-emerald-500/25"
                          : undefined
                      }
                    >
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">0</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {new Date(c.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <CampaignStatusActions
                      campaignId={c.id}
                      status={c.status}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({
          variant: active ? "default" : "ghost",
          size: "sm",
        }),
        "rounded-full"
      )}
    >
      {label}
    </Link>
  );
}
