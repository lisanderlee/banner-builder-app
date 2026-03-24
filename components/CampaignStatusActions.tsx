"use client";

import { setCampaignStatus } from "@/app/actions/campaigns";
import { Button } from "@/components/ui/button";
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
    <Button
      type="button"
      variant="link"
      size="sm"
      className="h-auto px-0"
      onClick={toggle}
      disabled={pending}
    >
      {pending ? "…" : status === "active" ? "Archive" : "Unarchive"}
    </Button>
  );
}
