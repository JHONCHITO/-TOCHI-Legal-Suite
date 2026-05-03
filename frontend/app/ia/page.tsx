"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Send, Sparkles } from "lucide-react";

export default function IA() {
  const [pregunta, setPregunta] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [fuentes, setFuentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const stopListening = () => {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.stop();
      recognitionRef.current = null;
    }
    setListening(false);
  };

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRespuesta("Tu navegador no soporta dictado por voz.");
      return;
    }

    if (recognitionRef.current) {
      stopListening();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-CO";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || "")
        .join("");
      setPregunta(transcript);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const preguntar = async () => {
    if (!pregunta.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: pregunta }],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo consultar la IA");
      }

      setRespuesta(data.respuesta || data.message || "");
      setFuentes(data.sources || data.fuentes || []);
    } catch (error) {
      setRespuesta(error instanceof Error ? error.message : "Error al consultar la IA");
      setFuentes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IA Legal</h1>
          <p className="text-muted-foreground">
            Consulta la base juridica y las novedades con texto o voz.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Activa
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pregunta legal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            placeholder="Escribe o dicta tu consulta legal..."
            className="min-h-[140px]"
            disabled={loading}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => (listening ? stopListening() : startListening())}
              disabled={loading}
            >
              {listening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
              {listening ? "Detener voz" : "Dictar"}
            </Button>
            <Button onClick={preguntar} disabled={loading || !pregunta.trim()}>
              <Send className="mr-2 h-4 w-4" />
              {loading ? "Consultando..." : "Preguntar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Respuesta</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm leading-6">{respuesta}</pre>

          {fuentes.length > 0 ? (
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-semibold">Fuentes</h3>
              {fuentes.map((f, i) => (
                <div key={`${f.codigo || "fuente"}-${i}`} className="rounded-lg border p-3 text-sm">
                  <div className="font-medium">
                    [{f.codigo}] Art. {f.articulo}
                  </div>
                  <div className="text-muted-foreground">{f.nombre || f.titulo}</div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
