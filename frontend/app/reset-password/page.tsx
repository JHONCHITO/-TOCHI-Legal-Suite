import { Suspense } from "react";
import ResetPasswordClient from "./reset-password-client";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-sm text-muted-foreground">Cargando recuperacion de contrasena...</div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
