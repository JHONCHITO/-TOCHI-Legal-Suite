"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Loader2, Lock, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const initialToken = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !token) {
      toast.error("El enlace de recuperacion no contiene todos los datos necesarios");
      return;
    }

    if (password.length < 6) {
      toast.error("La contrasena debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Las contrasenas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo actualizar la contrasena");
      }

      setDone(true);
      toast.success("Contrasena actualizada correctamente");
      setTimeout(() => router.push("/login"), 1800);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la contrasena");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4">
            <Scale className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">TOCHI Legal Suite</h1>
          <p className="text-muted-foreground text-sm">Restablece tu acceso de forma segura</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">{done ? "Contrasena actualizada" : "Crear nueva contrasena"}</CardTitle>
            <CardDescription>
              {done
                ? "Ya puedes entrar con tu nueva contrasena."
                : "Ingresa tu nueva contrasena para completar la recuperacion."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="space-y-6 py-4 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-emerald-600" />
                <p className="text-sm text-muted-foreground">
                  Tu contrasena fue actualizada. En unos segundos te llevaremos al inicio de sesion.
                </p>
                <Link href="/login" className="block">
                  <Button className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Ir a iniciar sesion
                  </Button>
                </Link>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electronico</Label>
                  <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token">Token de recuperacion</Label>
                  <Input id="token" value={token} onChange={(event) => setToken(event.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Nueva contrasena</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Actualizar contrasena
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
