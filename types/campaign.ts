export type CampaignStatus = "active" | "archived";

export type CampaignRow = {
  id: string;
  user_id: string;
  name: string;
  client: string;
  brand: string;
  status: CampaignStatus;
  created_at: string;
};
