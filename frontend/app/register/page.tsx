"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scale, Loader2 } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: "",
    telefono: "",
    tarjetaProfesional: "",
    especialidad: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Las contrasenas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
          password: formData.password,
          telefono: formData.telefono,
          tarjetaProfesional: formData.tarjetaProfesional,
          especialidades: formData.especialidad ? [formData.especialidad] : [],
          rol: "abogado",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al registrar");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Ocurrio un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-8">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4">
            <Scale className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">TOCHI Legal Suite</h1>
          <p className="text-muted-foreground text-sm">
            Crea tu cuenta de abogado
          </p>
        </div>

        {/* Register Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Registro</CardTitle>
            <CardDescription>
              Completa el formulario para crear tu cuenta
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
                    <Input
                      id="nombre"
                      placeholder="Juan"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, nombre: e.target.value })
                      }
                      required
                      disabled={loading}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="apellido">Apellido</FieldLabel>
                    <Input
                      id="apellido"
                      placeholder="Perez"
                      value={formData.apellido}
                      onChange={(e) =>
                        setFormData({ ...formData, apellido: e.target.value })
                      }
                      required
                      disabled={loading}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="email">Correo electronico</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="abogado@ejemplo.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    disabled={loading}
                  />
                </Field>

                <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Esta cuenta se crea como <span className="font-medium text-foreground">Abogado</span>.
                </div>

                <Field>
                  <FieldLabel htmlFor="telefono">Telefono</FieldLabel>
                  <Input
                    id="telefono"
                    type="tel"
                    placeholder="3001234567"
                    value={formData.telefono}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                    disabled={loading}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="tarjetaProfesional">
                    Tarjeta Profesional (opcional)
                  </FieldLabel>
                  <Input
                    id="tarjetaProfesional"
                    placeholder="123456"
                    value={formData.tarjetaProfesional}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tarjetaProfesional: e.target.value,
                      })
                    }
                    disabled={loading}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="especialidad">
                    Especialidad principal
                  </FieldLabel>
                  <Select
                    value={formData.especialidad}
                    onValueChange={(value) =>
                      setFormData({ ...formData, especialidad: value })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una especialidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="civil">Derecho Civil</SelectItem>
                      <SelectItem value="penal">Derecho Penal</SelectItem>
                      <SelectItem value="laboral">Derecho Laboral</SelectItem>
                      <SelectItem value="familia">Derecho de Familia</SelectItem>
                      <SelectItem value="comercial">Derecho Comercial</SelectItem>
                      <SelectItem value="administrativo">
                        Derecho Administrativo
                      </SelectItem>
                      <SelectItem value="tributario">
                        Derecho Tributario
                      </SelectItem>
                      <SelectItem value="general">Practica General</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="password">Contrasena</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      placeholder="********"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      disabled={loading}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirmPassword">Confirmar</FieldLabel>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="********"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                      disabled={loading}
                    />
                  </Field>
                </div>
              </FieldGroup>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Crear Cuenta"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Ya tienes cuenta?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Inicia sesion
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
