"use client";

import { useState, useEffect } from "react";

export default function BuscarPage() {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("ALL");
  const [codigos, setCodigos] = useState<string[]>([]);

  // 🔥 cargar códigos automáticamente
  useEffect(() => {
    const cargarCodigos = async () => {
      const res = await fetch("/api/codigos");
      const data = await res.json();
      setCodigos(data);
    };

    cargarCodigos();
  }, []);

  const buscar = async () => {
    if (!query.trim()) return;

    const res = await fetch(`/api/normas?q=${query}&codigo=${filtro}`);
    const data = await res.json();

    setResultados(Array.isArray(data) ? data : []);
  };

  // 🔥 resaltar palabras
  const resaltar = (texto: string) => {
    if (!query) return texto;

    const palabras = query.split(" ").join("|");
    const regex = new RegExp(`(${palabras})`, "gi");

    return texto.replace(regex, "<mark>$1</mark>");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Buscador Legal 🔎</h1>

      {/* INPUT */}
      <input
        type="text"
        placeholder="Buscar ley, artículo, tema..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") buscar();
        }}
        style={{
          padding: 10,
          width: "300px",
          borderRadius: 8,
          border: "1px solid #ccc",
        }}
      />

      {/* BOTÓN */}
      <button
        onClick={buscar}
        style={{
          marginLeft: 10,
          padding: "10px 15px",
          borderRadius: 8,
          backgroundColor: "#0b3a7e",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Buscar
      </button>

      {/* 🔥 FILTROS DINÁMICOS */}
      <div style={{ marginTop: 15 }}>
        <button
          onClick={() => setFiltro("ALL")}
          style={{
            marginRight: 5,
            padding: "5px 10px",
            borderRadius: 6,
            border: "none",
            backgroundColor: filtro === "ALL" ? "#0b3a7e" : "#ccc",
            color: "white",
          }}
        >
          Todos
        </button>

        {codigos.map((c) => (
          <button
            key={c}
            onClick={() => setFiltro(c)}
            style={{
              marginRight: 5,
              marginTop: 5,
              padding: "5px 10px",
              borderRadius: 6,
              border: "none",
              backgroundColor: filtro === c ? "#0b3a7e" : "#ccc",
              color: "white",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* RESULTADOS */}
      <div style={{ marginTop: 20 }}>
        {resultados.length === 0 && <p>No hay resultados...</p>}

        {resultados.map((item) => (
          <div
            key={item._id}
            style={{
              marginBottom: 20,
              padding: 15,
              border: "1px solid #ddd",
              borderRadius: 10,
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            }}
          >
            <h3>
              [{item.codigo}] Artículo {item.articulo}
            </h3>

            <p style={{ fontWeight: "bold" }}>{item.nombre}</p>

            <p
              dangerouslySetInnerHTML={{
                __html: resaltar(item.contenido.slice(0, 250)) + "...",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}