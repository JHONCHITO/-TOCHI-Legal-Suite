"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Scale, Loader2 } from "lucide-react";
import Link from "next/link";

const OWNER_BOOTSTRAP_EMAILS = ["jhonrique1@gmail.com", "jhonrique@gmail.com"];
const OWNER_BOOTSTRAP_PASSWORD = "Rick0066@#0066";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async (loginEmail: string, loginPassword: string) => {
    setError("");
    setLoading(true);

    try {
      const normalizedEmail = loginEmail.toLowerCase().trim();
      const isBootstrapAdmin =
        OWNER_BOOTSTRAP_EMAILS.includes(normalizedEmail) &&
        loginPassword === OWNER_BOOTSTRAP_PASSWORD;

      const result = await signIn("credentials", {
        email: normalizedEmail,
        password: loginPassword,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciales invalidas. Verifica tu email y contrasena.");
      } else {
        router.push(isBootstrapAdmin ? "/dashboard/admin" : "/dashboard");
        router.refresh();
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Ocurrio un error. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitLogin(email, password);
  };

  const handleAdminAccess = async () => {
    setEmail(OWNER_BOOTSTRAP_EMAILS[0]);
    setPassword(OWNER_BOOTSTRAP_PASSWORD);
    await submitLogin(OWNER_BOOTSTRAP_EMAILS[0], OWNER_BOOTSTRAP_PASSWORD);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4">
            <Scale className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">TOCHI Legal Suite</h1>
          <p className="text-muted-foreground text-sm">
            Plataforma integral para abogados colombianos
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Iniciar Sesion</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Correo electronico</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="abogado@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Contrasena</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </Field>
              </FieldGroup>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-input" />
                  <span className="text-muted-foreground">Recordarme</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-primary hover:underline"
                >
                  Olvidaste tu contrasena?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  "Ingresar"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={handleAdminAccess}
              >
                Entrar como administrador
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              No tienes cuenta?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Registrate aqui
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
