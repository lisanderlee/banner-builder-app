"use server";

import { createClient } from "@/lib/supabase/server";
import type { CampaignStatus } from "@/types/campaign";
import { revalidatePath } from "next/cache";

export type CreateCampaignResult =
  | { error: string }
  | { ok: true; id: string };

export async function createCampaign(formData: FormData): Promise<CreateCampaignResult> {
  const name = String(formData.get("name") ?? "").trim();
  const client = String(formData.get("client") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();

  if (!name) {
    return { error: "Name is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      user_id: user.id,
      name,
      client,
      brand,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { ok: true, id: data.id };
}

export async function setCampaignStatus(campaignId: string, status: CampaignStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("campaigns")
    .update({ status })
    .eq("id", campaignId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { ok: true };
}
