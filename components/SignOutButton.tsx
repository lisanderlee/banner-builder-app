"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
    setPending(false);
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleSignOut}
      disabled={pending}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
