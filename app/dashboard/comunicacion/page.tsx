"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, MessageSquare, Phone, Send } from "lucide-react";
import { demoCommunications, getClientById, getClientDisplayName } from "@/lib/demo-data";

export default function ComunicacionPage() {
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
              <p className="text-2xl font-bold">{demoCommunications.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Correos</p>
              <p className="text-2xl font-bold">
                {demoCommunications.filter((item) => item.canal === "Correo").length}
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
                {demoCommunications.filter((item) => item.canal === "Llamada").length}
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
            <Input placeholder="Escribe un mensaje o nota de seguimiento..." />
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Registrar
            </Button>
          </div>

          <div className="space-y-3">
            {demoCommunications.map((conversation) => {
              const client = getClientById(conversation.clienteId);
              return (
                <div key={conversation.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{conversation.canal}</Badge>
                      <p className="font-medium">
                        {client ? getClientDisplayName(client) : "Cliente"}
                      </p>
                    </div>
                    <Badge variant="secondary">{conversation.estado}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{conversation.mensaje}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{conversation.fecha}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
