"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Mail, Phone, Save, UserRound } from "lucide-react";
import { createClient } from "@/lib/hooks/use-data";
import { toast } from "sonner";

const departamentos = [
  "Amazonas", "Antioquia", "Arauca", "Atlantico", "Bolivar", "Boyaca", "Caldas",
  "Caqueta", "Casanare", "Cauca", "Cesar", "Choco", "Cordoba", "Cundinamarca",
  "Guainia", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Narino",
  "Norte de Santander", "Putumayo", "Quindio", "Risaralda", "San Andres y Providencia",
  "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupes", "Vichada"
];

export default function NuevoClientePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userRole = session?.user?.role;
  const isPrivileged = userRole === "superadmin" || userRole === "admin";
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    tipo: "persona_natural",
    nombre: "",
    apellido: "",
    cedula: "",
    razonSocial: "",
    nit: "",
    representanteLegal: "",
    email: "",
    telefono: "",
    celular: "",
    direccion: "",
    ciudad: "",
    departamento: "",
    tieneAccesoPortal: true,
    notas: "",
  });

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isPrivileged) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-lg font-medium">Vista protegida</p>
        <p className="text-sm text-muted-foreground text-center max-w-xl">
          El registro de clientes pertenece al despacho asignado y no se habilita desde el panel superadmin.
        </p>
        <Button asChild>
          <Link href="/dashboard/admin">Ir al panel administrativo</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async () => {
    // Validacion basica
    if (!formData.email || !formData.telefono || !formData.direccion || !formData.ciudad || !formData.departamento) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }

    if (formData.tipo === "persona_natural" && (!formData.nombre || !formData.apellido)) {
      toast.error("Nombre y apellido son requeridos para persona natural");
      return;
    }

    if (formData.tipo === "persona_juridica" && !formData.razonSocial) {
      toast.error("Razon social es requerida para persona juridica");
      return;
    }

    setIsSubmitting(true);
    try {
      await createClient(formData);
      toast.success("Cliente creado correctamente");
      router.push("/dashboard/clientes");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isNatural = formData.tipo === "persona_natural";

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo Cliente</h1>
          <p className="text-muted-foreground">
            Crea una ficha CRM legal con datos de contacto, identificacion, origen y notas internas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/clientes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a clientes
            </Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar cliente
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ficha de cliente</CardTitle>
          <CardDescription>Persona natural o juridica con datos base para expedientes y facturacion.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de cliente *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="persona_natural">Persona natural</SelectItem>
                  <SelectItem value="persona_juridica">Persona juridica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isNatural ? (
              <div className="space-y-2">
                <Label>Cedula</Label>
                <Input
                  placeholder="1020304050"
                  value={formData.cedula}
                  onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>NIT *</Label>
                <Input
                  placeholder="900123456-7"
                  value={formData.nit}
                  onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                />
              </div>
            )}
          </div>

          {isNatural ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  placeholder="Jhon"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input
                  placeholder="Perez"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Razon social *</Label>
                <Input
                  placeholder="Empresa ABC S.A.S."
                  value={formData.razonSocial}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Representante legal</Label>
                <Input
                  placeholder="Nombre del representante"
                  value={formData.representanteLegal}
                  onChange={(e) => setFormData({ ...formData, representanteLegal: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Correo electronico *</Label>
              <Input
                type="email"
                placeholder="cliente@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefono *</Label>
              <Input
                placeholder="3001234567"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Celular adicional</Label>
            <Input
              placeholder="3107654321"
              value={formData.celular}
              onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Direccion *</Label>
            <Input
              placeholder="Carrera 10 # 20 - 30"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Ciudad *</Label>
              <Input
                placeholder="Bogota"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Departamento *</Label>
              <Select
                value={formData.departamento}
                onValueChange={(value) => setFormData({ ...formData, departamento: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {departamentos.map((dep) => (
                    <SelectItem key={dep} value={dep}>
                      {dep}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="text-base">Habilitar portal del cliente</Label>
                <p className="text-sm text-muted-foreground">
                  Quedara marcado para vincularlo al portal cuando exista una cuenta de cliente con el mismo correo.
                </p>
              </div>
              <Switch
                checked={formData.tieneAccesoPortal}
                onCheckedChange={(checked) => setFormData({ ...formData, tieneAccesoPortal: checked })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas internas</Label>
            <Textarea
              rows={4}
              placeholder="Fuente del cliente, sensibilidad del caso, condiciones comerciales y preferencias de contacto."
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4 text-sm">
            <UserRound className="h-4 w-4 text-primary" />
            Vinculacion directa con casos y documentos
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4 text-sm">
            <Mail className="h-4 w-4 text-primary" />
            Preparado para correos y seguimiento
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4 text-sm">
            <Phone className="h-4 w-4 text-primary" />
            Compatible con comunicacion y recordatorios
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
