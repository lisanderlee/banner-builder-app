import { CreateCampaignForm } from "@/components/CreateCampaignForm";

export default function NewCampaignPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
      <CreateCampaignForm />
    </div>
  );
}
