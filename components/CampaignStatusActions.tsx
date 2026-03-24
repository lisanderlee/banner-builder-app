"use client";

import { setCampaignStatus } from "@/app/actions/campaigns";
import type { CampaignStatus } from "@/types/campaign";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  campaignId: string;
  status: CampaignStatus;
};

export function CampaignStatusActions({ campaignId, status }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    const next: CampaignStatus = status === "active" ? "archived" : "active";
    await setCampaignStatus(campaignId, next);
    router.refresh();
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="rounded-md px-2 py-1 text-sm font-medium text-sky-700 underline-offset-2 hover:underline disabled:opacity-50 dark:text-sky-400"
    >
      {pending
        ? "…"
        : status === "active"
          ? "Archive"
          : "Unarchive"}
    </button>
  );
}
