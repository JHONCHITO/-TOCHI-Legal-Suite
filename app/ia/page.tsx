"use client";

import { useState } from "react";

export default function IA() {
  const [pregunta, setPregunta] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [fuentes, setFuentes] = useState<any[]>([]);

  const preguntar = async () => {
    const res = await fetch("/api/ia", {
      method: "POST",
      body: JSON.stringify({ pregunta }),
    });

    const data = await res.json();

    setRespuesta(data.respuesta);
    setFuentes(data.fuentes || []);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>IA Legal ⚖️</h1>

      <input
        value={pregunta}
        onChange={(e) => setPregunta(e.target.value)}
        placeholder="Pregunta legal..."
        style={{ padding: 10, width: 300 }}
      />

      <button onClick={preguntar} style={{ marginLeft: 10 }}>
        Preguntar
      </button>

      <pre style={{ marginTop: 20 }}>
        {respuesta}
      </pre>

      <h3>Fuentes:</h3>

      {fuentes.map((f, i) => (
        <div key={i}>
          [{f.codigo}] Art {f.articulo}
        </div>
      ))}
    </div>
  );
}