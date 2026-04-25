"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Check,
  Copy,
  Loader2,
  MessageSquare,
  Scale,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSource {
  title: string;
  url: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
}

const suggestedQuestions = [
  "Que dice el articulo 1502 del Codigo Civil sobre los requisitos para obligarse?",
  "Cuales son las causales de despido con justa causa segun el Codigo Sustantivo del Trabajo?",
  "Que sentencias recientes deberia vigilar un abogado laboralista en Colombia?",
  "Que cambios normativos recientes afectan el derecho administrativo en Colombia?",
  "Que establece el articulo 29 de la Constitucion sobre el debido proceso?",
  "Resumen de novedades juridicas recientes en derecho disciplinario en Colombia.",
];

export default function AsistentePage() {
  const searchParams = useSearchParams();
  const context = searchParams.get("context");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!context) return;
    setInput(`Quiero analizar el contexto juridico de ${context}.`);
  }, [context]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sidebarPrompts = useMemo(() => {
    if (!context) return suggestedQuestions;
    return [
      `Analiza el contexto juridico de ${context} y dime los puntos clave.`,
      `Que articulos y sentencias debo revisar sobre ${context}?`,
      ...suggestedQuestions.slice(0, 4),
    ];
  }, [context]);

  const sendPrompt = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map((item) => ({
            role: item.role,
            content: item.content,
          })),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "No se pudo obtener respuesta del asistente.");
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: payload.message || "No se obtuvo contenido.",
        sources: Array.isArray(payload.sources) ? payload.sources : [],
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al consultar la IA.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendPrompt(input);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asistente Legal IA</h1>
          <p className="text-muted-foreground">
            Conectado a OpenAI y preparado para consultar derecho colombiano con fuentes oficiales.
          </p>
        </div>
        {messages.length > 0 ? (
          <Button variant="outline" size="sm" onClick={clearChat}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpiar chat
          </Button>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 gap-6">
        <Card className="flex min-h-0 flex-1 flex-col">
          <CardHeader className="border-b py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Scale className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">TOCHI Legal Assistant</CardTitle>
                <CardDescription className="text-xs">
                  OpenAI + fuentes juridicas oficiales de Colombia
                </CardDescription>
              </div>
              <Badge variant="secondary" className="ml-auto">
                <Sparkles className="mr-1 h-3 w-3" />
                IA activa
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-4">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold">Asistente listo</h3>
                  <p className="mb-6 max-w-xl text-sm text-muted-foreground">
                    Puedo ayudarte a interpretar codigos, revisar articulos, orientar estrategias y
                    buscar novedades recientes de normas y jurisprudencia desde fuentes oficiales.
                  </p>
                  <div className="flex max-w-2xl flex-wrap justify-center gap-2">
                    {sidebarPrompts.slice(0, 3).map((prompt) => (
                      <Button
                        key={prompt}
                        variant="outline"
                        size="sm"
                        className="h-auto px-3 py-2 text-xs"
                        onClick={() => void sendPrompt(prompt)}
                      >
                        {prompt.slice(0, 70)}...
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isUser = message.role === "user";
                    return (
                      <div key={message.id} className={cn("flex gap-3", isUser && "flex-row-reverse")}>
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback
                            className={cn(
                              isUser ? "bg-primary text-primary-foreground" : "bg-accent/20 text-accent"
                            )}
                          >
                            {isUser ? <User className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>

                        <div className={cn("max-w-[82%] flex-1", isUser && "flex justify-end")}>
                          <div
                            className={cn(
                              "rounded-lg p-3",
                              isUser ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}
                          >
                            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                          </div>

                          {!isUser ? (
                            <div className="mt-2 space-y-2">
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(message.content, message.id)}
                                >
                                  {copiedId === message.id ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>

                              {message.sources?.length ? (
                                <div className="rounded-lg border bg-background p-3">
                                  <p className="mb-2 text-xs font-medium text-muted-foreground">Fuentes</p>
                                  <div className="space-y-2">
                                    {message.sources.map((source) => (
                                      <a
                                        key={`${message.id}-${source.url}`}
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block text-xs text-primary hover:underline"
                                      >
                                        {source.title}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}

                  {loading ? (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-accent/20 text-accent">
                          <Scale className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="rounded-lg bg-muted p-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  ) : null}

                  {error ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  ) : null}
                </div>
              )}
            </ScrollArea>

            <div className="border-t p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu consulta legal o pide novedades recientes por area..."
                  className="max-h-[140px] min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendPrompt(input);
                    }
                  }}
                  disabled={loading}
                />
                <Button type="submit" size="icon" className="h-[60px] w-[60px]" disabled={loading || !input.trim()}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </form>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Enter envia. Shift+Enter agrega una nueva linea.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="hidden w-80 flex-col gap-4 lg:flex">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Consultas sugeridas</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {sidebarPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void sendPrompt(prompt)}
                    className="w-full rounded-lg border p-2 text-left text-xs transition-colors hover:bg-muted/50"
                    disabled={loading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Atajos</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <Link
                  href="/dashboard/leyes"
                  className="flex items-center gap-2 rounded-lg border p-2 text-xs transition-colors hover:bg-muted/50"
                >
                  <BookOpen className="h-4 w-4" />
                  Ver codigos legales
                </Link>
                <Link
                  href="/dashboard/actualizaciones"
                  className="flex items-center gap-2 rounded-lg border p-2 text-xs transition-colors hover:bg-muted/50"
                >
                  <Scale className="h-4 w-4" />
                  Ver novedades juridicas
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                <strong>Nota:</strong> Cuando preguntes por sentencias o normas recientes, el asistente
                prioriza fuentes oficiales colombianas y puede devolverte enlaces consultados.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
