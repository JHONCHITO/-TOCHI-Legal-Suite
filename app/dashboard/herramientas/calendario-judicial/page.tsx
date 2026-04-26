"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, ChevronLeft, ChevronRight, Info } from "lucide-react"

// Festivos Colombia 2024-2026
const festivosColombia: Record<string, string> = {
  // 2024
  "2024-01-01": "Año Nuevo",
  "2024-01-08": "Dia de los Reyes Magos",
  "2024-03-25": "Dia de San Jose",
  "2024-03-28": "Jueves Santo",
  "2024-03-29": "Viernes Santo",
  "2024-05-01": "Dia del Trabajo",
  "2024-05-13": "Dia de la Ascension",
  "2024-06-03": "Corpus Christi",
  "2024-06-10": "Sagrado Corazon",
  "2024-07-01": "San Pedro y San Pablo",
  "2024-07-20": "Dia de la Independencia",
  "2024-08-07": "Batalla de Boyaca",
  "2024-08-19": "Asuncion de la Virgen",
  "2024-10-14": "Dia de la Raza",
  "2024-11-04": "Todos los Santos",
  "2024-11-11": "Independencia de Cartagena",
  "2024-12-08": "Inmaculada Concepcion",
  "2024-12-25": "Navidad",
  // 2025
  "2025-01-01": "Año Nuevo",
  "2025-01-06": "Dia de los Reyes Magos",
  "2025-03-24": "Dia de San Jose",
  "2025-04-17": "Jueves Santo",
  "2025-04-18": "Viernes Santo",
  "2025-05-01": "Dia del Trabajo",
  "2025-06-02": "Dia de la Ascension",
  "2025-06-23": "Corpus Christi",
  "2025-06-30": "Sagrado Corazon",
  "2025-06-30": "San Pedro y San Pablo",
  "2025-07-20": "Dia de la Independencia",
  "2025-08-07": "Batalla de Boyaca",
  "2025-08-18": "Asuncion de la Virgen",
  "2025-10-13": "Dia de la Raza",
  "2025-11-03": "Todos los Santos",
  "2025-11-17": "Independencia de Cartagena",
  "2025-12-08": "Inmaculada Concepcion",
  "2025-12-25": "Navidad",
  // 2026
  "2026-01-01": "Año Nuevo",
  "2026-01-12": "Dia de los Reyes Magos",
  "2026-03-23": "Dia de San Jose",
  "2026-04-02": "Jueves Santo",
  "2026-04-03": "Viernes Santo",
  "2026-05-01": "Dia del Trabajo",
  "2026-05-18": "Dia de la Ascension",
  "2026-06-08": "Corpus Christi",
  "2026-06-15": "Sagrado Corazon",
  "2026-06-29": "San Pedro y San Pablo",
  "2026-07-20": "Dia de la Independencia",
  "2026-08-07": "Batalla de Boyaca",
  "2026-08-17": "Asuncion de la Virgen",
  "2026-10-12": "Dia de la Raza",
  "2026-11-02": "Todos los Santos",
  "2026-11-16": "Independencia de Cartagena",
  "2026-12-08": "Inmaculada Concepcion",
  "2026-12-25": "Navidad",
}

// Vacancia judicial
const vacanciaJudicial = [
  { inicio: "2024-01-01", fin: "2024-01-09", descripcion: "Vacancia de inicio de año" },
  { inicio: "2024-03-28", fin: "2024-03-29", descripcion: "Semana Santa" },
  { inicio: "2024-06-24", fin: "2024-07-14", descripcion: "Vacancia colectiva mitad de año" },
  { inicio: "2024-12-20", fin: "2024-12-31", descripcion: "Vacancia de fin de año" },
  { inicio: "2025-01-01", fin: "2025-01-09", descripcion: "Vacancia de inicio de año" },
  { inicio: "2025-04-17", fin: "2025-04-18", descripcion: "Semana Santa" },
  { inicio: "2025-06-23", fin: "2025-07-13", descripcion: "Vacancia colectiva mitad de año" },
  { inicio: "2025-12-20", fin: "2025-12-31", descripcion: "Vacancia de fin de año" },
  { inicio: "2026-01-01", fin: "2026-01-09", descripcion: "Vacancia de inicio de año" },
  { inicio: "2026-04-02", fin: "2026-04-03", descripcion: "Semana Santa" },
  { inicio: "2026-06-22", fin: "2026-07-12", descripcion: "Vacancia colectiva mitad de año" },
  { inicio: "2026-12-20", fin: "2026-12-31", descripcion: "Vacancia de fin de año" },
]

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

const diasSemana = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]

export default function CalendarioJudicialPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString())

  const year = parseInt(selectedYear)
  const month = currentDate.getMonth()

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const esFestivo = (date: Date) => {
    const dateStr = formatDate(date)
    return festivosColombia[dateStr]
  }

  const esVacancia = (date: Date) => {
    const dateStr = formatDate(date)
    return vacanciaJudicial.find(v => dateStr >= v.inicio && dateStr <= v.fin)
  }

  const esDiaHabil = (date: Date) => {
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) return false
    if (esFestivo(date)) return false
    if (esVacancia(date)) return false
    return true
  }

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i))
  }

  const festivosDelMes = Object.entries(festivosColombia)
    .filter(([date]) => date.startsWith(`${year}-${(month + 1).toString().padStart(2, "0")}`))

  const vacanciasDelMes = vacanciaJudicial.filter(v => {
    const mesInicio = parseInt(v.inicio.split("-")[1])
    const mesFin = parseInt(v.fin.split("-")[1])
    const yearInicio = parseInt(v.inicio.split("-")[0])
    return yearInicio === year && (mesInicio === month + 1 || mesFin === month + 1)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calendario Judicial</h1>
        <p className="text-muted-foreground">
          Consulta dias habiles, festivos y periodos de vacancia judicial en Colombia
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-xl font-semibold">
                    {meses[month]} {year}
                  </div>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Select value={selectedYear} onValueChange={(v) => {
                  setSelectedYear(v)
                  setCurrentDate(new Date(parseInt(v), month, 1))
                }}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {diasSemana.map(dia => (
                  <div key={dia} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {dia}
                  </div>
                ))}
                {days.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="h-12" />
                  }
                  
                  const festivo = esFestivo(date)
                  const vacancia = esVacancia(date)
                  const habil = esDiaHabil(date)
                  const isToday = formatDate(date) === formatDate(new Date())
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6

                  return (
                    <div
                      key={date.toISOString()}
                      className={`
                        h-12 flex items-center justify-center rounded-lg text-sm relative
                        ${isToday ? "ring-2 ring-primary" : ""}
                        ${festivo ? "bg-red-100 text-red-800" : ""}
                        ${vacancia && !festivo ? "bg-orange-100 text-orange-800" : ""}
                        ${isWeekend && !festivo && !vacancia ? "bg-gray-100 text-gray-500" : ""}
                        ${habil ? "hover:bg-green-50" : ""}
                      `}
                      title={festivo || vacancia?.descripcion || (habil ? "Dia habil" : "No habil")}
                    >
                      <span className={`${habil ? "font-medium" : ""}`}>
                        {date.getDate()}
                      </span>
                      {habil && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full" />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 rounded border border-green-300" />
                  <span className="text-sm">Dia habil</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 rounded border border-red-300" />
                  <span className="text-sm">Festivo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-100 rounded border border-orange-300" />
                  <span className="text-sm">Vacancia judicial</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 rounded border border-gray-300" />
                  <span className="text-sm">Fin de semana</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Festivos del mes</CardTitle>
            </CardHeader>
            <CardContent>
              {festivosDelMes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay festivos este mes</p>
              ) : (
                <ul className="space-y-2">
                  {festivosDelMes.map(([date, nombre]) => (
                    <li key={date} className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        {new Date(date + "T12:00:00").getDate()}
                      </Badge>
                      <span className="text-sm">{nombre}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vacancia judicial</CardTitle>
            </CardHeader>
            <CardContent>
              {vacanciasDelMes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay vacancia este mes</p>
              ) : (
                <ul className="space-y-3">
                  {vacanciasDelMes.map((v, i) => (
                    <li key={i} className="text-sm">
                      <p className="font-medium">{v.descripcion}</p>
                      <p className="text-muted-foreground">
                        {new Date(v.inicio + "T12:00:00").toLocaleDateString("es-CO")} - {new Date(v.fin + "T12:00:00").toLocaleDateString("es-CO")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Nota importante</p>
                  <p className="text-blue-700 mt-1">
                    Durante la vacancia judicial no corren terminos procesales, excepto para acciones de tutela y habeas corpus.
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
