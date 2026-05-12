"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Book, Scale, Star, ExternalLink, Loader2, BookOpen, FileText } from "lucide-react"

interface LegalCode {
  _id: string
  code: string
  name: string
  description: string
  category: string
  tags: string[]
  year: number
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
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    fetchCodes()
    const savedFavorites = localStorage.getItem("legal-favorites")
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }, [])

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
      if (res.ok) {
        await fetchCodes()
      }
    } catch (error) {
      console.error("Error seeding codes:", error)
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedCode(null)}>
            ← Volver a la biblioteca
          </Button>
          <Button
            variant="outline"
            onClick={() => toggleFavorite(selectedCode._id)}
          >
            <Star className={`h-4 w-4 mr-2 ${favorites.includes(selectedCode._id) ? "fill-yellow-400 text-yellow-400" : ""}`} />
            {favorites.includes(selectedCode._id) ? "Quitar de favoritos" : "Agregar a favoritos"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <div>
                <Badge className="mb-1">{selectedCode.code}</Badge>
                <CardTitle>{selectedCode.name}</CardTitle>
                <CardDescription>{selectedCode.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedCode.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
              <Badge variant="outline">Año {selectedCode.year}</Badge>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Articulos ({selectedCode.articles.length})</h3>
              {selectedCode.articles.map((article, index) => (
                <Card key={index} className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-1">Art. {article.number}</Badge>
                      <div>
                        <p className="font-medium">{article.title}</p>
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                          {article.content}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
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
        {codes.length === 0 && (
          <Button onClick={seedCodes}>
            <BookOpen className="h-4 w-4 mr-2" />
            Cargar Codigos Legales
          </Button>
        )}
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
