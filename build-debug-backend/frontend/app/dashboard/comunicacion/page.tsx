"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Mail, MessageSquare, Phone, Send, Plus } from "lucide-react";
import { useCases, useClients } from "@/lib/hooks/use-data";
import { useToast } from "@/hooks/use-toast";
import { getClientDisplayName } from "@/lib/utils/format";

type CommunicationRecord = {
  _id?: string;
  id?: string;
  canal: string;
  clienteId?: string | Record<string, unknown>;
  casoId?: string | Record<string, unknown>;
  mensaje: string;
  estado: string;
  fecha?: string;
};

const canalLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  correo: "Correo",
  llamada: "Llamada",
  reunion: "Reunion",
  sms: "SMS",
  otro: "Otro",
  Nota: "Nota",
};

function getCommunicationDate(value: unknown) {
  if (typeof value === "string" && value.trim()) return value;
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}

export default function ComunicacionPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickMessage, setQuickMessage] = useState("");
  const [quickNotes, setQuickNotes] = useState<CommunicationRecord[]>([]);
  const [communications, setCommunications] = useState<CommunicationRecord[]>([]);
  const [isLoadingCommunications, setIsLoadingCommunications] = useState(true);
  const { clients } = useClients();
  const { cases } = useCases();
  const { toast } = useToast();

  const [nuevaComunicacion, setNuevaComunicacion] = useState({
    canal: "whatsapp",
    clienteId: "",
    casoId: "",
    mensaje: "",
    estado: "pendiente",
  });

  useEffect(() => {
    let active = true;

    const loadCommunications = async () => {
      try {
        const response = await fetch("/api/communications");
        if (!response.ok) {
          throw new Error("Error al cargar comunicaciones");
        }

        const data = (await response.json()) as CommunicationRecord[];
        if (!active) return;

        setCommunications(data);
      } catch {
        if (active) {
          setCommunications([]);
        }
      } finally {
        if (active) {
          setIsLoadingCommunications(false);
        }
      }
    };

    loadCommunications();

    return () => {
      active = false;
    };
  }, []);

  const allCommunications = useMemo(
    () => [...quickNotes, ...communications],
    [quickNotes, communications]
  );

  const handleQuickRegister = () => {
    if (!quickMessage.trim()) {
      toast({
        title: "Error",
        description: "Escribe un mensaje para registrar",
        variant: "destructive",
      });
      return;
    }

    const newComm: CommunicationRecord = {
      id: `comm-${Date.now()}`,
      canal: "Nota",
      clienteId: "",
      mensaje: quickMessage,
      estado: "Registrado",
      fecha: getCommunicationDate(new Date()),
    };

    setQuickNotes((current) => [newComm, ...current]);
    setQuickMessage("");
    toast({
      title: "Nota registrada",
      description: "La nota de seguimiento se ha guardado solo en la vista actual.",
    });
  };

  const handleRegistrar = async () => {
    if (!nuevaComunicacion.mensaje || !nuevaComunicacion.canal || !nuevaComunicacion.clienteId) {
      toast({
        title: "Error",
        description: "Completa canal, cliente y mensaje",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nuevaComunicacion,
          tipo: "salida",
          prioridad: "media",
          fecha: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "No se pudo registrar la comunicacion");
      }

      const saved = (await response.json()) as CommunicationRecord;
      setCommunications((current) => [saved, ...current]);

      toast({
        title: "Comunicacion registrada",
        description: "El registro se guardo en MongoDB",
      });
      setDialogOpen(false);
      setNuevaComunicacion({
        canal: "whatsapp",
        clienteId: "",
        casoId: "",
        mensaje: "",
        estado: "pendiente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo registrar la comunicacion",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClientName = (clienteId: string | Record<string, unknown> | undefined) => {
    if (!clienteId) return "General";

  if (typeof clienteId === "object") {
    const client = clienteId as { tipo?: string; nombre?: string; apellido?: string; razonSocial?: string };
    const clientType = client.tipo === "persona_juridica" ? "persona_juridica" : "persona_natural";
    return getClientDisplayName({
      tipo: clientType,
      nombre: client.nombre,
      apellido: client.apellido,
      razonSocial: client.razonSocial,
    });
  }

    const client = clients?.find((item: { _id: string; tipo: string; nombre?: string; apellido?: string; razonSocial?: string }) => item._id === clienteId);
    if (client) {
      return client.tipo === "persona_natural"
        ? `${client.nombre || ""} ${client.apellido || ""}`.trim()
        : client.razonSocial || "Cliente";
    }

    return "Cliente";
  };

  const stats = useMemo(() => {
    const mensajes = allCommunications.filter((item) => item.canal !== "Nota").length;
    const correos = allCommunications.filter((item) => item.canal === "correo" || item.canal === "Correo").length;
    const llamadas = allCommunications.filter((item) => item.canal === "llamada" || item.canal === "Llamada").length;
    return { mensajes, correos, llamadas };
  }, [allCommunications]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comunicacion con Clientes</h1>
        <p className="text-muted-foreground">
          Seguimiento por WhatsApp, correo y llamadas con trazabilidad para cada expediente.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Mensajes activos</p>
              <p className="text-2xl font-bold">{stats.mensajes + quickNotes.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Correos</p>
              <p className="text-2xl font-bold">{stats.correos}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Phone className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Llamadas</p>
              <p className="text-2xl font-bold">{stats.llamadas}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Centro de seguimiento</CardTitle>
          <CardDescription>Conserva historial de contacto y proximos compromisos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Escribe una nota rapida de seguimiento..."
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickRegister()}
            />
            <Button onClick={handleQuickRegister}>
              <Send className="mr-2 h-4 w-4" />
              Registrar
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo registro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Comunicacion</DialogTitle>
                  <DialogDescription>
                    Registra una comunicacion con un cliente
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Canal *</Label>
                      <Select
                        value={nuevaComunicacion.canal}
                        onValueChange={(v) => setNuevaComunicacion({ ...nuevaComunicacion, canal: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="correo">Correo</SelectItem>
                          <SelectItem value="llamada">Llamada</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select
                        value={nuevaComunicacion.estado}
                        onValueChange={(v) => setNuevaComunicacion({ ...nuevaComunicacion, estado: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="respondido">Respondido</SelectItem>
                          <SelectItem value="sin_respuesta">Sin respuesta</SelectItem>
                          <SelectItem value="completado">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cliente *</Label>
                    <Select
                      value={nuevaComunicacion.clienteId}
                      onValueChange={(v) => setNuevaComunicacion({ ...nuevaComunicacion, clienteId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map((client: { _id: string; tipo: string; nombre?: string; apellido?: string; razonSocial?: string }) => (
                          <SelectItem key={client._id} value={client._id}>
                            {client.tipo === "persona_natural"
                              ? `${client.nombre || ""} ${client.apellido || ""}`.trim()
                              : client.razonSocial}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Caso relacionado</Label>
                    <Select
                      value={nuevaComunicacion.casoId}
                      onValueChange={(v) => setNuevaComunicacion({ ...nuevaComunicacion, casoId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar caso (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {cases?.map((caso: { _id: string; numeroInterno?: string; titulo?: string }) => (
                          <SelectItem key={caso._id} value={caso._id}>
                            {caso.numeroInterno} - {caso.titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Mensaje *</Label>
                    <Textarea
                      placeholder="Detalle de la comunicacion..."
                      value={nuevaComunicacion.mensaje}
                      onChange={(e) => setNuevaComunicacion({ ...nuevaComunicacion, mensaje: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleRegistrar} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Registrar"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {isLoadingCommunications ? (
              <div className="flex h-[160px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : communications.length === 0 ? (
              <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                No hay comunicaciones registradas todavia.
              </div>
            ) : (
              allCommunications.map((conversation) => (
                <div key={conversation._id || conversation.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{canalLabels[conversation.canal] || conversation.canal}</Badge>
                      <p className="font-medium">{getClientName(conversation.clienteId)}</p>
                    </div>
                    <Badge variant="secondary">{conversation.estado}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{conversation.mensaje}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {conversation.fecha ? new Date(conversation.fecha).toLocaleString("es-CO") : "Sin fecha"}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
