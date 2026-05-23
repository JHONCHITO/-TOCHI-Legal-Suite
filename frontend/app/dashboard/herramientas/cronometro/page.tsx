"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw, Clock, Bell, Plus, Trash2, Volume2, VolumeX } from "lucide-react"

interface Intervencion {
  id: string
  nombre: string
  tiempo: number
  tiempoAsignado: number
  activo: boolean
  completado: boolean
}

export default function CronometroAudienciasPage() {
  const [intervenciones, setIntervenciones] = useState<Intervencion[]>([
    { id: "1", nombre: "Alegatos demandante", tiempo: 0, tiempoAsignado: 600, activo: false, completado: false },
    { id: "2", nombre: "Alegatos demandado", tiempo: 0, tiempoAsignado: 600, activo: false, completado: false },
    { id: "3", nombre: "Replica demandante", tiempo: 0, tiempoAsignado: 300, activo: false, completado: false },
    { id: "4", nombre: "Replica demandado", tiempo: 0, tiempoAsignado: 300, activo: false, completado: false },
  ])
  const [nuevaIntervencion, setNuevaIntervencion] = useState("")
  const [nuevoTiempo, setNuevoTiempo] = useState(10)
  const [sonidoActivo, setSonidoActivo] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Crear elemento de audio para la alerta
    audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAYAKqPi75lzCwAbm/DRjWIQABqn6cJzOQcAHKHhq2crBwAep+G/eDgLABqm4rtoJgoAGaThvXI2DQAZp+K8byoPABmm4bxtLA8AGKXhu2wqDwAYpuG7bCoPABim4btsKg8AGKbhu2wqDwAYpuG7bCoPAA==")
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  useEffect(() => {
    const activa = intervenciones.find(i => i.activo)
    
    if (activa) {
      intervalRef.current = setInterval(() => {
        setIntervenciones(prev => prev.map(i => {
          if (i.activo) {
            const nuevoTiempo = i.tiempo + 1
            // Alerta cuando se acaba el tiempo
            if (nuevoTiempo === i.tiempoAsignado && sonidoActivo && audioRef.current) {
              audioRef.current.play()
            }
            return { ...i, tiempo: nuevoTiempo }
          }
          return i
        }))
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [intervenciones, sonidoActivo])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const toggleIntervencion = (id: string) => {
    setIntervenciones(prev => prev.map(i => ({
      ...i,
      activo: i.id === id ? !i.activo : false
    })))
  }

  const resetIntervencion = (id: string) => {
    setIntervenciones(prev => prev.map(i => 
      i.id === id ? { ...i, tiempo: 0, activo: false, completado: false } : i
    ))
  }

  const marcarCompletado = (id: string) => {
    setIntervenciones(prev => prev.map(i => 
      i.id === id ? { ...i, completado: true, activo: false } : i
    ))
  }

  const agregarIntervencion = () => {
    if (!nuevaIntervencion.trim()) return
    const nueva: Intervencion = {
      id: Date.now().toString(),
      nombre: nuevaIntervencion,
      tiempo: 0,
      tiempoAsignado: nuevoTiempo * 60,
      activo: false,
      completado: false
    }
    setIntervenciones(prev => [...prev, nueva])
    setNuevaIntervencion("")
    setNuevoTiempo(10)
  }

  const eliminarIntervencion = (id: string) => {
    setIntervenciones(prev => prev.filter(i => i.id !== id))
  }

  const resetAll = () => {
    setIntervenciones(prev => prev.map(i => ({
      ...i,
      tiempo: 0,
      activo: false,
      completado: false
    })))
  }

  const tiempoTotal = intervenciones.reduce((acc, i) => acc + i.tiempo, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cronometro de Audiencias</h1>
          <p className="text-muted-foreground">
            Controla el tiempo de intervenciones en audiencias judiciales
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSonidoActivo(!sonidoActivo)}
          >
            {sonidoActivo ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={resetAll}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reiniciar todo
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {intervenciones.map((intervencion) => {
            const porcentaje = Math.min((intervencion.tiempo / intervencion.tiempoAsignado) * 100, 100)
            const excedido = intervencion.tiempo > intervencion.tiempoAsignado
            
            return (
              <Card 
                key={intervencion.id} 
                className={`transition-all ${intervencion.activo ? "ring-2 ring-primary" : ""} ${intervencion.completado ? "opacity-60" : ""}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Clock className={`h-5 w-5 ${intervencion.activo ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
                      <div>
                        <p className="font-medium">{intervencion.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          Tiempo asignado: {formatTime(intervencion.tiempoAsignado)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {intervencion.completado && (
                        <Badge variant="secondary">Completado</Badge>
                      )}
                      {excedido && !intervencion.completado && (
                        <Badge variant="destructive">Excedido</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => eliminarIntervencion(intervencion.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className={`text-4xl font-mono font-bold ${excedido ? "text-destructive" : intervencion.activo ? "text-primary" : ""}`}>
                      {formatTime(intervencion.tiempo)}
                    </div>

                    <div className="flex-1">
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${excedido ? "bg-destructive" : "bg-primary"}`}
                          style={{ width: `${Math.min(porcentaje, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {excedido 
                          ? `Excedido por ${formatTime(intervencion.tiempo - intervencion.tiempoAsignado)}`
                          : `Restante: ${formatTime(intervencion.tiempoAsignado - intervencion.tiempo)}`
                        }
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant={intervencion.activo ? "default" : "outline"}
                        onClick={() => toggleIntervencion(intervencion.id)}
                        disabled={intervencion.completado}
                      >
                        {intervencion.activo ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => resetIntervencion(intervencion.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => marcarCompletado(intervencion.id)}
                        disabled={intervencion.completado}
                      >
                        Finalizar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Agregar Intervencion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  placeholder="Ej: Testimonio perito"
                  value={nuevaIntervencion}
                  onChange={(e) => setNuevaIntervencion(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tiempo asignado (minutos)</Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={nuevoTiempo}
                  onChange={(e) => setNuevoTiempo(parseInt(e.target.value) || 10)}
                />
              </div>
              <Button className="w-full" onClick={agregarIntervencion}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen de Audiencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Tiempo total transcurrido</p>
                <p className="text-4xl font-mono font-bold text-primary">
                  {formatTime(tiempoTotal)}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-2">
                <div>
                  <p className="text-2xl font-bold">
                    {intervenciones.filter(i => i.completado).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Completadas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {intervenciones.filter(i => !i.completado).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Bell className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900">Alerta de tiempo</p>
                  <p className="text-amber-700">
                    Sonara una alerta cuando se agote el tiempo asignado a cada intervencion
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
