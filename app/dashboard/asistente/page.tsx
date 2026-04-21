"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare,
  Send,
  Scale,
  User,
  Loader2,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const suggestedQuestions = [
  "Que dice el articulo 1502 del Codigo Civil sobre los requisitos para obligarse?",
  "Cuales son las causales de despido con justa causa segun el Codigo Laboral?",
  "Que es la accion de tutela y cuando procede?",
  "Cuales son los terminos de prescripcion en el CGP?",
  "Que establece el articulo 29 de la Constitucion sobre el debido proceso?",
  "Como funciona la sucesion intestada en Colombia?",
];

export default function AsistentePage() {
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleSuggestionClick = (question: string) => {
    sendMessage({ text: question });
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const getMessageText = (message: typeof messages[0]): string => {
    return message.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("") || "";
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asistente Legal IA</h1>
          <p className="text-muted-foreground">
            Consulta sobre leyes y codigos colombianos
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearChat}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpiar chat
          </Button>
        )}
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Main Chat Area */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="py-3 border-b">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Scale className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">TOCHI Legal Assistant</CardTitle>
                <CardDescription className="text-xs">
                  Especializado en derecho colombiano
                </CardDescription>
              </div>
              <Badge variant="secondary" className="ml-auto">
                <Sparkles className="mr-1 h-3 w-3" />
                IA
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Bienvenido al Asistente Legal</h3>
                  <p className="text-sm text-muted-foreground max-w-md mb-6">
                    Puedo ayudarte con consultas sobre la legislacion colombiana,
                    explicar articulos de los codigos y orientarte sobre procedimientos legales.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {suggestedQuestions.slice(0, 3).map((question, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="text-xs h-auto py-2 px-3"
                        onClick={() => handleSuggestionClick(question)}
                      >
                        {question.slice(0, 50)}...
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const text = getMessageText(message);
                    const isUser = message.role === "user";

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          isUser && "flex-row-reverse"
                        )}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback
                            className={cn(
                              isUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-accent/20 text-accent"
                            )}
                          >
                            {isUser ? <User className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            "flex-1 max-w-[80%]",
                            isUser && "flex justify-end"
                          )}
                        >
                          <div
                            className={cn(
                              "rounded-lg p-3",
                              isUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap">{text}</p>
                          </div>
                          {!isUser && (
                            <div className="flex gap-1 mt-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(text, message.id)}
                              >
                                {copiedId === message.id ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-accent/20 text-accent">
                          <Scale className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg p-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu consulta legal..."
                  className="min-h-[60px] max-h-[120px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" className="h-[60px] w-[60px]" disabled={isLoading || !input.trim()}>
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Presiona Enter para enviar, Shift+Enter para nueva linea
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="w-80 hidden lg:flex flex-col gap-4">
          {/* Suggested Questions */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Preguntas sugeridas</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {suggestedQuestions.map((question, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(question)}
                    className="w-full text-left text-xs p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                    disabled={isLoading}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Enlaces rapidos</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <a
                  href="/dashboard/leyes"
                  className="flex items-center gap-2 text-xs p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  Ver Codigos Legales
                </a>
                <a
                  href="https://www.suin-juriscol.gov.co/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Scale className="h-4 w-4" />
                  SUIN-Juriscol
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                <strong>Nota:</strong> Este asistente proporciona informacion orientativa
                sobre la legislacion colombiana. Para casos especificos, siempre
                consulte con un abogado profesional.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
