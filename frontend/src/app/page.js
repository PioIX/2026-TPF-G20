"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const API = "http://localhost:4000";

// Colores de cada tipo de línea del registro
const COLORES_LOG = {
  ok: "border-green-500 bg-green-50 text-green-900",
  error: "border-red-500 bg-red-50 text-red-900",
  entrada: "border-blue-500 bg-blue-50 text-blue-900",
  salida: "border-gray-400 bg-gray-50 text-gray-800",
};

const EVENTOS_DEL_BACK = ["salaAsignada", "jugadoresSala", "empiezaPartida", "rivalDesconectado", "errorSala"];

export default function Home() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [usuario, setUsuario] = useState(null);   // { idUsuario, nickname } después del login
  const [socket, setSocket] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [sala, setSala] = useState(null);
  const [log, setLog] = useState([]);              // Todo lo que pasa, lo más nuevo arriba

  // Agrega una línea al registro de eventos
  function agregarLog(tipo, titulo, datos) {
    const hora = new Date().toLocaleTimeString();
    setLog((prev) => [{ tipo, hora, titulo, datos }, ...prev]);
  }

  // fetch genérico al backend: siempre manda la cookie de sesión
  async function pedir(metodo, ruta, body) {
    try {
      const response = await fetch(API + ruta, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json();
      agregarLog(response.ok ? "ok" : "error", `${metodo} ${ruta} → ${response.status}`, data);
      return { status: response.status, data };
    } catch (error) {
      agregarLog("error", `${metodo} ${ruta} → SIN CONEXIÓN`, error.message);
      return { status: 0, data: null };
    }
  }

  // ---------- HTTP ----------

  async function registrar() {
    await pedir("POST", "/register", { nickname, email, password });
  }

  async function login() {
    const r = await pedir("POST", "/login", { email, password });
    if (r.status === 200) {
      setUsuario(r.data.usuario);
      conectarSocket(); // Recién ahora, para que el socket lleve la cookie de sesión
    }
  }

  // ---------- SOCKET ----------

  function conectarSocket() {
    const s = io(API, { withCredentials: true });

    s.on("connect", () => {
      setConectado(true);
      agregarLog("entrada", "Socket conectado", { id: s.id });
    });
    s.on("disconnect", () => {
      setConectado(false);
      setSala(null);
      agregarLog("error", "Socket desconectado", "");
    });

    EVENTOS_DEL_BACK.forEach((nombre) => {
      s.on(nombre, (data) => {
        if (nombre === "salaAsignada") setSala(data.room);
        agregarLog(nombre === "errorSala" ? "error" : "entrada", "⬅ " + nombre, data);
      });
    });

    setSala(null);
    setSocket(s); // Si había uno anterior, el useEffect de abajo lo desconecta
  }

  // Cierra el socket viejo cuando se crea uno nuevo, o cuando se cierra la página
  useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
    };
  }, [socket]);

  function buscarSala() {
    socket.emit("buscarSala");
    agregarLog("salida", "➡ buscarSala", "");
  }

  // ---------- PANTALLA ----------

  const estiloInput =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200";
  const estiloBoton =
    "rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500";
  const estiloBotonSecundario =
    "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400";
  const estiloTarjeta = "rounded-lg border border-gray-200 bg-white p-4 shadow-sm";
  const estiloTitulo = "mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500";

  return (
    <div className="min-h-screen bg-gray-100 p-4 text-gray-900 md:p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4 text-2xl font-bold">Prueba del backend</h1>

        {/* Estado */}
        <div className="mb-6 flex flex-wrap gap-2 text-sm">
          <span className={`rounded-full px-3 py-1 font-medium ${usuario ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
            Usuario: {usuario ? `${usuario.nickname} (id ${usuario.idUsuario})` : "sin login"}
          </span>
          <span className={`rounded-full px-3 py-1 font-medium ${conectado ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
            Socket: {conectado ? "conectado" : "desconectado"}
          </span>
          <span className={`rounded-full px-3 py-1 font-medium ${sala ? "bg-blue-100 text-blue-800" : "bg-gray-200 text-gray-600"}`}>
            Sala: {sala || "ninguna"}
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-[340px_1fr]">
          {/* Columna izquierda: controles */}
          <div className="flex flex-col gap-4">
            <div className={estiloTarjeta}>
              <h2 className={estiloTitulo}>Datos</h2>
              <div className="flex flex-col gap-2">
                <input className={estiloInput} placeholder="nickname (solo para registro)" value={nickname} onChange={(e) => setNickname(e.target.value)} />
                <input className={estiloInput} placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input className={estiloInput} placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <div className={estiloTarjeta}>
              <h2 className={estiloTitulo}>HTTP</h2>
              <div className="grid grid-cols-2 gap-2">
                <button className={estiloBoton} onClick={registrar}>Registrar</button>
                <button className={estiloBoton} onClick={login}>Login</button>
                <button className={estiloBotonSecundario} onClick={() => pedir("GET", "/estadisticas")}>Estadísticas</button>
                <button className={estiloBotonSecundario} onClick={() => pedir("GET", "/historial")}>Historial</button>
              </div>
            </div>

            <div className={estiloTarjeta}>
              <h2 className={estiloTitulo}>Socket</h2>
              <div className="grid grid-cols-2 gap-2">
                <button className={estiloBoton} onClick={buscarSala} disabled={!conectado}>Buscar sala</button>
                <button className={estiloBotonSecundario} onClick={conectarSocket} disabled={!usuario}>Reconectar</button>
              </div>
              {!usuario && <p className="mt-2 text-xs text-gray-500">El socket se conecta después del login.</p>}
            </div>
          </div>

          {/* Columna derecha: registro */}
          <div className={estiloTarjeta}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className={estiloTitulo + " mb-0"}>Registro de eventos</h2>
              <button className={estiloBotonSecundario} onClick={() => setLog([])}>Limpiar</button>
            </div>

            {log.length === 0 && <p className="text-sm text-gray-500">Todavía no pasó nada. Probá registrar o hacer login.</p>}

            <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto">
              {log.map((l, i) => (
                <div key={i} className={`rounded-md border-l-4 px-3 py-2 ${COLORES_LOG[l.tipo]}`}>
                  <div className="text-sm font-semibold">
                    <span className="mr-2 font-mono text-xs opacity-60">{l.hora}</span>
                    {l.titulo}
                  </div>
                  {l.datos !== "" && (
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                      {JSON.stringify(l.datos, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
