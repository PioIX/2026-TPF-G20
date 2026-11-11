"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Conecta la página con su archivo de estilos
import styles from './page.module.css'

// URL base del back (la misma que usás en el login)
const API = "http://localhost:4000"

function Admin() {

  const router = useRouter()

  const [autorizado, setAutorizado] = useState(false)

  const [nombre, setNombre] = useState("")
  const [goles, setGoles] = useState("")
  const [pais, setPais] = useState("")

  const [resultados, setResultados] = useState([])
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")

  // Si no entró como admin desde el login, lo mandamos de vuelta al login
  useEffect(() => {
    if (sessionStorage.getItem("esAdmin") === "true") {
      setAutorizado(true)
    } else {
      router.push("/login")
    }
  }, [])

  // Función auxiliar: hace el POST al back y devuelve la respuesta ya leída
  async function pedir(ruta, body) {
    const respuesta = await fetch(API + ruta, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    })
    const data = await respuesta.json()
    return { ok: respuesta.ok, data: data }
  }

  function limpiarMensajes() {
    setMensaje("")
    setError("")
  }

  // ---------- BUSCAR ----------
  async function buscarFutbolista() {
    limpiarMensajes()
    setResultados([])

    if (!nombre) {
      setError("Escribí el nombre del futbolista")
      return
    }

    try {
      const { ok, data } = await pedir("/admin/buscar", { nombre: nombre })

      if (!ok) {
        setError(data.mensaje || "No se pudo buscar")
        return
      }

      // El back puede devolver un array directo o { futbolistas: [...] }
      const lista = Array.isArray(data) ? data : (data.futbolistas || [])

      if (lista.length === 0) {
        setError("No se encontró ningún futbolista con ese nombre")
      }
      setResultados(lista)
    } catch (e) {
      console.log("Error en el fetch:", e)
      setError("No se pudo conectar con el servidor")
    }
  }

  // Al tocar un resultado, se cargan sus datos en el formulario
  function elegirResultado(futbolista) {
    setNombre(futbolista.nombre)
    setGoles(futbolista.goles)
    setPais(futbolista.pais)
    setResultados([])
  }

  // ---------- AGREGAR ----------
  async function agregarFutbolista() {
    limpiarMensajes()

    if (!nombre || goles === "" || !pais) {
      setError("Completá nombre, goles y país")
      return
    }

    try {
      const { ok, data } = await pedir("/admin/agregar", {
        nombre: nombre,
        goles: Number(goles),
        pais: pais
      })

      if (ok) {
        setMensaje(data.mensaje || "Futbolista agregado")
      } else {
        setError(data.mensaje || "No se pudo agregar")
      }
    } catch (e) {
      console.log("Error en el fetch:", e)
      setError("No se pudo conectar con el servidor")
    }
  }

  // ---------- ELIMINAR ----------
  async function eliminarFutbolista() {
    limpiarMensajes()

    if (!nombre) {
      setError("Escribí el nombre del futbolista a eliminar")
      return
    }

    try {
      const { ok, data } = await pedir("/admin/eliminar", { nombre: nombre })

      if (ok) {
        setMensaje(data.mensaje || "Futbolista eliminado")
        setGoles("")
        setPais("")
      } else {
        setError(data.mensaje || "No se pudo eliminar")
      }
    } catch (e) {
      console.log("Error en el fetch:", e)
      setError("No se pudo conectar con el servidor")
    }
  }

  // ---------- CERRAR SESIÓN ----------
  async function cerrarSesion() {
    sessionStorage.removeItem("esAdmin")

    try {
      await fetch(API + "/logout", { method: "POST", credentials: "include" })
    } catch (e) {
      console.log("Error al cerrar sesión:", e)
    }

    router.push("/login")
  }

  // Mientras se verifica el permiso no se muestra nada
  if (!autorizado) return null

  return (
    <div className={styles.fondo}>
      <div className={styles.tarjeta}>

        <h1 className={styles.titulo}>Administrador</h1>
        <p className={styles.subtitulo}>Gestioná los futbolistas del juego</p>

        <label className={styles.label}>Nombre del futbolista</label>
        <input
          className={styles.input}
          type='text'
          placeholder='Se usa para buscar, agregar y eliminar'
          value={nombre}
          onChange={(e) => { setNombre(e.target.value) }}
          onKeyDown={(e) => { if (e.key === "Enter") buscarFutbolista() }}
        ></input>

        <button className={styles.boton} onClick={buscarFutbolista}>
          Buscar
        </button>

        {/* Lista de resultados de la búsqueda */}
        {resultados.length > 0 && (
          <ul className={styles.resultados}>
            {resultados.map((f, i) => (
              <li key={i}>
                <button
                  className={styles.resultado}
                  onClick={() => { elegirResultado(f) }}
                >
                  {f.nombre} — {f.goles} goles ({f.pais})
                </button>
              </li>
            ))}
          </ul>
        )}

        <hr className={styles.separador}></hr>

        <label className={styles.label}>Cantidad de goles</label>
        <input
          className={styles.input}
          type='number'
          min='0'
          placeholder='Goles en mundiales'
          value={goles}
          onChange={(e) => { setGoles(e.target.value) }}
        ></input>

        <label className={styles.label}>País</label>
        <input
          className={styles.input}
          type='text'
          placeholder='Debe coincidir con el nombre del archivo de la bandera'
          value={pais}
          onChange={(e) => { setPais(e.target.value) }}
        ></input>

        {/* Solo se muestran si hay mensaje o error */}
        {mensaje && <p className={styles.exito}>{mensaje}</p>}
        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.boton} onClick={agregarFutbolista}>
          Agregar
        </button>

        <button className={styles.botonEliminar} onClick={eliminarFutbolista}>
          Eliminar
        </button>

        <button className={styles.botonSecundario} onClick={cerrarSesion}>
          Cerrar sesión
        </button>

      </div>
    </div>
  )
}

export default Admin