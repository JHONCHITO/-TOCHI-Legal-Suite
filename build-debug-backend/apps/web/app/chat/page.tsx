"use client";
import { useState, useRef, useEffect, KeyboardEvent } from "react";

type Fuente = {
  titulo?: string;
};

type Mensaje = {
  rol: "user" | "ia";
  texto: string;
  fuentes?: Fuente[];
};

export default function ChatIA() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState<string>("");
  const [cargando, setCargando] = useState<boolean>(false);

  const chatRef = useRef<HTMLDivElement | null>(null);

  // 🔥 Scroll automático
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensajes]);

  // 🔥 Cargar historial
  useEffect(() => {
    const cargarChats = async () => {
      try {
        const res = await fetch("/api/chats");
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setMensajes(data[0].mensajes || []);
        }
      } catch (error) {
        console.error("Error cargando historial:", error);
      }
    };

    cargarChats();
  }, []);

  const enviarMensaje = async () => {
    if (!input.trim()) return;

    const pregunta = input;

    const nuevosMensajes: Mensaje[] = [
      ...mensajes,
      { rol: "user", texto: pregunta },
    ];

    setMensajes(nuevosMensajes);
    setInput("");
    setCargando(true);

    try {
      const res = await fetch("/api/consulta-ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pregunta }),
      });

      const data = await res.json();

      const respuestaIA: Mensaje = {
        rol: "ia",
        texto: data?.respuesta ?? "Sin respuesta",
        fuentes: data?.fuentes ?? [],
      };

      const chatFinal: Mensaje[] = [...nuevosMensajes, respuestaIA];

      setMensajes(chatFinal);

      // 💾 Guardar historial
      await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mensajes: chatFinal }),
      });
    } catch (error) {
      console.error(error);

      setMensajes([
        ...nuevosMensajes,
        { rol: "ia", texto: "Error en la IA" },
      ]);
    }

    setCargando(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") enviarMensaje();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>⚖️ Chat Legal IA</h2>

      <div ref={chatRef} style={styles.chat}>
        {mensajes.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.mensaje,
              alignSelf: msg.rol === "user" ? "flex-end" : "flex-start",
              backgroundColor:
                msg.rol === "user" ? "#2563eb" : "#1e293b",
              color: "white",
            }}
          >
            {msg.texto}

            {/* 📚 Fuentes */}
            {msg.fuentes && msg.fuentes.length > 0 && (
              <div style={styles.fuentes}>
                📚 Fuentes:
                {msg.fuentes.map((f, idx) => (
                  <div key={idx}>
                    • {f?.titulo ?? "Artículo"}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {cargando && (
          <div style={styles.loading}>🤖 Escribiendo...</div>
        )}
      </div>

      <div style={styles.inputContainer}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Haz tu pregunta legal..."
          style={styles.input}
        />
        <button onClick={enviarMensaje} style={styles.button}>
          Enviar
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    padding: 20,
    background: "#0f172a",
  },
  title: {
    textAlign: "center",
    color: "white",
  },
  chat: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 10,
  },
  mensaje: {
    padding: 12,
    borderRadius: 12,
    maxWidth: "70%",
  },
  fuentes: {
    marginTop: 8,
    fontSize: 12,
    color: "#94a3b8",
  },
  loading: {
    color: "#94a3b8",
  },
  inputContainer: {
    display: "flex",
    gap: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    border: "none",
    outline: "none",
  },
  button: {
    padding: "12px 20px",
    borderRadius: 8,
    background: "#2563eb",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
};