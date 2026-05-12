"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Loader2, Mail, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDevResetUrl("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al procesar la solicitud");
        return;
      }

      if (data?.resetPasswordUrl) {
        setDevResetUrl(String(data.resetPasswordUrl));
      }

      setSent(true);
    } catch {
      setError("Ocurrio un error. Intenta de nuevo.");
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
          <p className="text-muted-foreground text-sm">Recupera el acceso a tu cuenta</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">{sent ? "Revisa tu correo" : "Recuperar contrasena"}</CardTitle>
            <CardDescription>
              {sent
                ? "Te hemos enviado instrucciones para restablecer tu contrasena"
                : "Ingresa tu correo y te enviaremos un enlace para restablecer tu contrasena"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center py-6">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Hemos enviado un correo a <strong>{email}</strong> con instrucciones para restablecer tu contrasena.
                  </p>
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    Si no ves el correo, revisa tu carpeta de spam.
                  </p>
                </div>

                {devResetUrl ? (
                  <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">En desarrollo</p>
                    <p className="mt-1">El enlace de restablecimiento esta disponible para pruebas locales.</p>
                    <a href={devResetUrl} className="mt-3 inline-flex text-primary hover:underline">
                      Abrir enlace de restablecimiento
                    </a>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSent(false);
                      setEmail("");
                      setDevResetUrl("");
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar a otro correo
                  </Button>

                  <Link href="/login" className="block">
                    <Button variant="default" className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver a iniciar sesion
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error ? (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
                ) : null}

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">Correo electronico</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </Field>
                </FieldGroup>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar instrucciones
                    </>
                  )}
                </Button>

                <Link href="/login" className="block">
                  <Button type="button" variant="ghost" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al inicio de sesion
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>
            ¿Recuerdas tu contrasena?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Inicia sesion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
