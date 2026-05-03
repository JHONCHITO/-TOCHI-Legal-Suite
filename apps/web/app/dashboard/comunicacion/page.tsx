"use client";

import { useState } from "react";
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
import { Mail, MessageSquare, Phone, Send, Plus, Loader2 } from "lucide-react";
import { demoCommunications, getClientById, getClientDisplayName } from "@/lib/demo-data";
import { useClients, useCases } from "@/lib/hooks/use-data";
import { useToast } from "@/hooks/use-toast";

export default function ComunicacionPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickMessage, setQuickMessage] = useState("");
  const { clients } = useClients();
  const { cases } = useCases();
  const { toast } = useToast();
  const [localCommunications, setLocalCommunications] = useState(demoCommunications);
  
  const [nuevaComunicacion, setNuevaComunicacion] = useState({
    canal: "whatsapp",
    clienteId: "",
    casoId: "",
    mensaje: "",
    estado: "enviado",
  });

  const handleQuickRegister = () => {
    if (!quickMessage.trim()) {
      toast({
        title: "Error",
        description: "Escribe un mensaje para registrar",
        variant: "destructive",
      });
      return;
    }
    
    const newComm: any = {
      id: `comm-${Date.now()}`,
      canal: "Nota",
      clienteId: "",
      mensaje: quickMessage,
      estado: "Registrado",
      fecha: new Date().toLocaleDateString("es-CO", { 
        day: "2-digit", 
        month: "short", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
    };
    
    setLocalCommunications([newComm, ...localCommunications]);
    setQuickMessage("");
    toast({
      title: "Nota registrada",
      description: "La nota de seguimiento se ha guardado",
    });
  };

  const handleRegistrar = async () => {
    if (!nuevaComunicacion.mensaje || !nuevaComunicacion.canal) {
      toast({
        title: "Error",
        description: "Completa los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Simular guardado (en producción se conectaría con una API real)
      const newComm: any = {
        id: `comm-${Date.now()}`,
        canal: nuevaComunicacion.canal === "whatsapp" ? "WhatsApp" 
          : nuevaComunicacion.canal === "correo" ? "Correo" 
          : nuevaComunicacion.canal === "llamada" ? "Llamada" : "SMS",
        clienteId: nuevaComunicacion.clienteId,
        mensaje: nuevaComunicacion.mensaje,
        estado: nuevaComunicacion.estado === "enviado" ? "Enviado" : "Pendiente",
        fecha: new Date().toLocaleDateString("es-CO", { 
          day: "2-digit", 
          month: "short", 
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
      };
      
      setLocalCommunications([newComm, ...localCommunications]);
      
      toast({
        title: "Comunicacion registrada",
        description: "El registro se ha guardado exitosamente",
      });
      setDialogOpen(false);
      setNuevaComunicacion({
        canal: "whatsapp",
        clienteId: "",
        casoId: "",
        mensaje: "",
        estado: "enviado",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar la comunicacion",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClientName = (clienteId: string) => {
    if (!clienteId) return "General";
    const client = clients?.find((c: any) => c._id === clienteId);
    if (!client) {
      // Buscar en datos demo
      const demoClient = getClientById(clienteId);
      if (demoClient) return getClientDisplayName(demoClient);
      return "Cliente";
    }
    return client.tipo === "persona_natural"
      ? `${client.nombre || ""} ${client.apellido || ""}`
      : client.razonSocial;
  };

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
              <p className="text-2xl font-bold">{localCommunications.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Correos</p>
              <p className="text-2xl font-bold">
                {localCommunications.filter((item) => item.canal === "Correo").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Phone className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Llamadas</p>
              <p className="text-2xl font-bold">
                {localCommunications.filter((item) => item.canal === "Llamada").length}
              </p>
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
                          <SelectItem value="enviado">Enviado</SelectItem>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select
                      value={nuevaComunicacion.clienteId}
                      onValueChange={(v) => setNuevaComunicacion({ ...nuevaComunicacion, clienteId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map((client: any) => (
                          <SelectItem key={client._id} value={client._id}>
                            {client.tipo === "persona_natural"
                              ? `${client.nombre || ""} ${client.apellido || ""}`
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
                        {cases?.map((caso: any) => (
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
            {localCommunications.map((conversation) => (
              <div key={conversation.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{conversation.canal}</Badge>
                    <p className="font-medium">
                      {getClientName(conversation.clienteId)}
                    </p>
                  </div>
                  <Badge variant="secondary">{conversation.estado}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{conversation.mensaje}</p>
                <p className="mt-2 text-xs text-muted-foreground">{conversation.fecha}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
