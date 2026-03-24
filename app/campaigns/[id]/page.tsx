import { createClient } from "@/lib/supabase/server";
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
      <header className="flex flex-col gap-2 border-b border-zinc-200 pb-6 dark:border-zinc-700">
        <Link
          href="/"
          className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-400"
        >
          ← Campaigns
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {c.name}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {c.client && `${c.client}`}
          {c.client && c.brand ? " · " : ""}
          {c.brand && `${c.brand}`}
        </p>
      </header>

      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 px-6 py-12 text-center dark:border-zinc-600 dark:bg-zinc-900/40">
        <p className="text-zinc-700 dark:text-zinc-300">
          Deliverables and assets workspace arrives in{" "}
          <span className="font-medium">Phase 2</span>.
        </p>
      </div>
    </div>
  );
}
