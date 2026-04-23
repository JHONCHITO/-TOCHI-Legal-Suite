"use client";

import { useState } from "react";

export default function BusquedaPage() {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);

  const buscar = async () => {
    try {
      // 🔍 búsqueda interna
      const res = await fetch(`/api/busqueda?q=${query}`);
      const data = await res.json();

      // 🌐 fuentes externas
      const res2 = await fetch(`/api/fuentes?q=${query}`);
      const externas = await res2.json();

      // 🔥 unir resultados
      setResultados([...data, ...externas]);
    } catch (error) {
      console.error("Error en búsqueda:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Buscador Legal</h1>

      <input
        type="text"
        placeholder="Buscar artículo o tema..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: "10px", width: "300px", marginRight: "10px" }}
      />

      <button onClick={buscar} style={{ padding: "10px" }}>
        Buscar
      </button>

      <div style={{ marginTop: "20px" }}>
        {resultados.length === 0 && <p>No hay resultados</p>}

        {resultados.map((r: any, i: number) => (
          <div
            key={i}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            <h3>{r.codigo || r.fuente}</h3>

            {r.articulo && <p>Artículo: {r.articulo}</p>}

            <p>{r.titulo}</p>

            {r.resumen && <small>{r.resumen}</small>}

            {r.link && (
              <div>
                <a href={r.link} target="_blank">
                  🔗 Ver fuente oficial
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}