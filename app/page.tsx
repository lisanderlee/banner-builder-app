import { CampaignStatusActions } from "@/components/CampaignStatusActions";
import { SignOutButton } from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase/server";
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
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Campaigns
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage HTML5 and static banner campaigns.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/campaigns/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            New campaign
          </Link>
          <SignOutButton />
        </div>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-700">
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
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {error.message}
        </p>
      ) : null}

      {list.length === 0 && !error ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 px-6 py-16 text-center dark:border-zinc-600 dark:bg-zinc-900/40">
          <p className="text-zinc-700 dark:text-zinc-300">
            No campaigns yet. Create one to get started.
          </p>
          <Link
            href="/campaigns/new"
            className="mt-4 inline-block text-sm font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
          >
            New campaign
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Client</th>
                <th className="hidden px-4 py-3 sm:table-cell">Brand</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Deliverables</th>
                <th className="hidden px-4 py-3 md:table-cell">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {list.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="text-sky-700 hover:underline dark:text-sky-400"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {c.client || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-700 dark:text-zinc-300 sm:table-cell">
                    {c.brand || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        c.status === "active"
                          ? "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                          : "inline-flex rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
                      }
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    0
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-600 dark:text-zinc-400 md:table-cell">
                    {new Date(c.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CampaignStatusActions
                      campaignId={c.id}
                      status={c.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      className={
        active
          ? "rounded-full bg-zinc-900 px-3 py-1 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "rounded-full px-3 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      }
    >
      {label}
    </Link>
  );
}
