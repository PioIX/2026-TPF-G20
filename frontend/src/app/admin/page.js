"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Usa el mismo css que el login
import styles from '../login/page.module.css'

// URL base del back (la misma que usás en el login)
const API = "http://localhost:4000"

function Admin() {

  const router = useRouter()

  const [autorizado, setAutorizado] = useState(false)

  const [nombre, setNombre] = useState("")
  const [categoria, setCategoria] = useState("")

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
  async function buscar() {
    limpiarMensajes()
    setResultados([])

    if (!nombre) {
      setError("Escribí el nombre de lo que quieres buscar")
      return
    }

    try {
      const { ok, data } = await pedir("/admin/buscar", { nombre: nombre })

      if (!ok) {
        setError(data.mensaje || "No se pudo buscar")
        return
      }

      // El back puede devolver un array directo o { futbolistas: [...] }
      const lista = Array.isArray(data) ? data : (data.tematicaImpostor || [])

      if (lista.length === 0) {
        setError("No se encontró nada con ese nombre")
      }
      setResultados(lista)
    } catch (e) {
      console.log("Error en el fetch:", e)
      setError("No se pudo conectar con el servidor")
    }
  }

  // Al tocar un resultado, se cargan sus datos en el formulario
  function elegirResultado(tematicaImpostor) {
    setNombre(tematicaImpostor.nombre)
    setCategoria(tematicaImpostor.categoria)
    setResultados([])
  }

  // ---------- AGREGAR ----------
  async function agregar() {
    limpiarMensajes()

    if (!nombre ||  !categoria) {
      setError("Completá todos los datos")
      return
    }

    try {
      const { ok, data } = await pedir("/admin/agregar", {
        nombre: nombre,
        categoria: categoria
      })

      if (ok) {
        setMensaje(data.mensaje || "se ha agregado correctamente")
      } else {
        setError(data.mensaje || "No se pudo agregar")
      }
    } catch (e) {
      console.log("Error en el fetch:", e)
      setError("No se pudo conectar con el servidor")
    }
  }

  // ---------- ELIMINAR ----------
  async function eliminar() {
    limpiarMensajes()

    if (!nombre) {
      setError("Escribí el nombre a eliminar")
      return
    }

    try {
      const { ok, data } = await pedir("/admin/eliminar", { nombre: nombre })

      if (ok) {
        setMensaje(data.mensaje || "se ha eliminado correctamente")
        setCategoria("")
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
        <p className={styles.subtitulo}>Gestioná de juego</p>

        <label className={styles.label}>Nombre</label>
        <input
          className={styles.input}
          type='text'
          placeholder='Se usa para buscar, agregar y eliminar'
          value={nombre}
          onChange={(e) => { setNombre(e.target.value) }}
          onKeyDown={(e) => { if (e.key === "Enter") buscar() }}
        ></input>

        <button className={styles.boton} onClick={buscar}>
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
                  {f.nombre} — ({f.categoria})
                </button>
              </li>
            ))}
          </ul>
        )}

        <hr className={styles.separador}></hr>

        {/* Solo se muestran si hay mensaje o error */}
        {mensaje && <p className={styles.exito}>{mensaje}</p>}
        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.boton} onClick={agregar}>
          Agregar
        </button>

        <button className={styles.botonEliminar} onClick={eliminar}>
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