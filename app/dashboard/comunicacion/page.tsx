"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, Mail, Phone, Send } from "lucide-react";

const conversations = [
  { canal: "WhatsApp", cliente: "Juan Perez", mensaje: "Confirma envio de documentos laborales", estado: "Pendiente" },
  { canal: "Correo", cliente: "Maria Garcia", mensaje: "Solicitud de avance del proceso", estado: "Respondido" },
  { canal: "Llamada", cliente: "Empresa ABC S.A.S.", mensaje: "Ajuste de reunion de seguimiento", estado: "Hoy" },
];

export default function ComunicacionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comunicacion con Clientes</h1>
        <p className="text-muted-foreground">
          Seguimiento por WhatsApp, correo, llamadas y mensajes internos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Mensajes activos</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Correos pendientes</p>
              <p className="text-2xl font-bold">4</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Phone className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Llamadas programadas</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Centro de seguimiento</CardTitle>
          <CardDescription>Registra interacciones y mantiene trazabilidad con el cliente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Escribe un mensaje o nota de seguimiento..." />
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Registrar
            </Button>
          </div>

          <div className="space-y-3">
            {conversations.map((conversation) => (
              <div key={`${conversation.canal}-${conversation.cliente}`} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{conversation.canal}</Badge>
                    <p className="font-medium">{conversation.cliente}</p>
                  </div>
                  <Badge variant="secondary">{conversation.estado}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{conversation.mensaje}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
