"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Book, Scale, Star, ExternalLink, Loader2, BookOpen, FileText } from "lucide-react"
import { toast } from "sonner"
import { LegalCodeDetailView } from "@/components/legal/legal-code-detail-view"

interface LegalCode {
  _id: string
  code: string
  name: string
  description: string
  category: string
  tags: string[]
  year: number
  source?: "db" | "local"
  articles: Array<{
    number: string
    title: string
    content: string
  }>
}

export default function BibliotecaLegalPage() {
  const [codes, setCodes] = useState<LegalCode[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [selectedCode, setSelectedCode] = useState<LegalCode | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<null | {
    _id: string
    code: string
    name: string
    description: string
    category: string
    tags: string[]
    year: number
    source?: "db" | "local"
    articles: Array<{
      number: string
      title: string
      content: string
      libro?: string
      capitulo?: string
      seccion?: string
    }>
    resources?: Array<{ label: string; url: string }>
  }>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    fetchCodes()
    const savedFavorites = localStorage.getItem("legal-favorites")
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [])

  useEffect(() => {
    if (!selectedCode) {
      setSelectedDetail(null)
      setDetailError(null)
      setDetailLoading(false)
      return
    }

    let cancelled = false

    const fetchDetail = async () => {
      setDetailLoading(true)
      setDetailError(null)

      try {
        const res = await fetch(`/api/legal-codes/${encodeURIComponent(selectedCode.code)}`)
        const payload = await res.json().catch(() => ({}))

        if (!res.ok) {
          throw new Error(payload?.error || "No se pudo cargar el visor completo")
        }

        if (!cancelled) {
          setSelectedDetail(payload)
        }
      } catch (error) {
        if (!cancelled) {
          setDetailError(error instanceof Error ? error.message : "No se pudo cargar el visor completo")
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false)
        }
      }
    }

    void fetchDetail()

    return () => {
      cancelled = true
    }
  }, [selectedCode])

  const fetchCodes = async () => {
    try {
      const res = await fetch("/api/legal-codes")
      if (res.ok) {
        const data = await res.json()
        setCodes(data)
      }
    } catch (error) {
      console.error("Error fetching codes:", error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ["Todos", ...new Set(codes.map(c => c.category))]

  const filteredCodes = codes.filter(code => {
    const matchesSearch = 
      code.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      code.articles.some(a => 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    const matchesCategory = selectedCategory === "Todos" || code.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleFavorite = (codeId: string) => {
    const newFavorites = favorites.includes(codeId)
      ? favorites.filter(f => f !== codeId)
      : [...favorites, codeId]
    setFavorites(newFavorites)
    localStorage.setItem("legal-favorites", JSON.stringify(newFavorites))
  }

  const seedCodes = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/legal-codes/seed-all", { method: "POST" })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload?.error || "No se pudieron sincronizar los codigos")
      }
      await fetchCodes()
      toast.success(payload?.message || "Codigos legales sincronizados")
    } catch (error) {
      console.error("Error seeding codes:", error)
      toast.error(error instanceof Error ? error.message : "No se pudieron sincronizar los codigos")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (selectedCode) {
    return (
      <LegalCodeDetailView
        code={selectedCode}
        detail={selectedDetail}
        loading={detailLoading}
        error={detailError}
        onBack={() => {
          setSelectedCode(null)
          setSelectedDetail(null)
          setDetailError(null)
        }}
        onToggleFavorite={toggleFavorite}
        favorite={favorites.includes(selectedCode._id)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Biblioteca Legal</h1>
          <p className="text-muted-foreground">
            Accede a codigos, leyes y jurisprudencia colombiana actualizada
          </p>
        </div>
        <Button onClick={seedCodes} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <BookOpen className="h-4 w-4 mr-2" />
          )}
          {codes.length === 0 ? "Cargar Codigos Legales" : "Sincronizar Codigos"}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar codigos, articulos, temas o numero de norma..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => setSearchTerm("")} variant="outline">
              Limpiar
            </Button>
          </div>

          {searchTerm && (
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-sm text-muted-foreground">Recientes:</span>
              {["1502 codigo civil", "debido proceso", "justa causa cst", "derecho de peticion cpaca"].map(term => (
                <Badge 
                  key={term} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => setSearchTerm(term)}
                >
                  {term}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="codigos">
        <TabsList>
          <TabsTrigger value="codigos" className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            Codigos
          </TabsTrigger>
          <TabsTrigger value="jurisprudencia" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Jurisprudencia
          </TabsTrigger>
          <TabsTrigger value="favoritos" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Favoritos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="codigos" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>

          {filteredCodes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No se encontraron codigos</p>
                <p className="text-muted-foreground">
                  {codes.length === 0 
                    ? "Haz clic en 'Cargar Codigos Legales' para comenzar"
                    : "Intenta con otros terminos de busqueda"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCodes.map(code => (
                <Card 
                  key={code._id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedCode(code)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Scale className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{code.code}</Badge>
                        <Badge variant="secondary">{code.articles.length} extractos</Badge>
                        {code.source ? (
                          <Badge variant={code.source === "db" ? "default" : "outline"}>
                            {code.source === "db" ? "BD sincronizada" : "Fallback local"}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <h3 className="font-semibold mb-1">{code.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {code.description.length > 80 
                        ? code.description.substring(0, 80) + "..." 
                        : code.description
                      }
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {code.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="jurisprudencia" className="mt-4">
          <Card>
            <CardContent className="py-12 text-center">
              <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Jurisprudencia</p>
              <p className="text-muted-foreground mb-4">
                Consulta sentencias de las altas cortes
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" asChild>
                  <a href="https://www.corteconstitucional.gov.co/relatoria/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Corte Constitucional
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://www.cortesuprema.gov.co/corte/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Corte Suprema
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favoritos" className="mt-4">
          {favorites.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No tienes favoritos</p>
                <p className="text-muted-foreground">
                  Agrega codigos a favoritos para acceder rapidamente
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {codes.filter(c => favorites.includes(c._id)).map(code => (
                <Card 
                  key={code._id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedCode(code)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Scale className="h-5 w-5 text-primary" />
                      </div>
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </div>
                    <h3 className="font-semibold mb-1">{code.name}</h3>
                    <p className="text-sm text-muted-foreground">{code.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
