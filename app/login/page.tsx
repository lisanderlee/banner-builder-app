import { LoginForm } from "@/components/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-muted/40 px-4 py-16">
      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">Loading…</div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
