"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'   // AGREGADO: faltaba importar useEffect

// Usa el mismo css que el login
import styles from '../login/page.module.css'

// URL base del back (la misma que usás en el login)
const API = "http://localhost:4000"

// AGREGADO: las 5 temáticas de la tabla tematicaImpostor (docs/bdd.sql)
const CATEGORIAS = ["futbolistas", "paises", "peliculas", "animales", "cantantes"]

function Admin() {

  const router = useRouter()

  const [autorizado, setAutorizado] = useState(false)

  const [nombre, setNombre] = useState("")
  const [categoria, setCategoria] = useState("")
  const [idElegido, setIdElegido] = useState(null)   // AGREGADO: id de la palabra que se tocó en la lista (para editar o eliminar)

  const [resultados, setResultados] = useState([])
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState("")

  // Si no entró como admin desde el login, lo mandamos de vuelta al login
  useEffect(() => {
    if (sessionStorage.getItem("esAdmin") === "true") {
      setAutorizado(true)
    } else {
      router.push("/login")   // MODIFICADO: antes mandaba a /admin (a sí misma) y se quedaba en blanco
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
    setIdElegido(null)   // AGREGADO

    if (!nombre && !categoria) {   // MODIFICADO: alcanza con elegir una temática
      setError("Escribí el nombre de lo que quieres buscar o elegí una temática")
      return
    }

    try {
      // MODIFICADO: ahora es un GET con el nombre y la temática en la URL (antes era un POST con pedir)
      const respuesta = await fetch(
        API + "/admin/palabras?nombre=" + encodeURIComponent(nombre) + "&categoria=" + encodeURIComponent(categoria),
        {
          method: "GET",
          credentials: "include"   // IMPORTANTE: manda la cookie de sesión (el back comprueba que sea admin)
        }
      )
      const data = await respuesta.json()
      const ok = respuesta.ok

      if (!ok) {
        setError(data.mensaje || "No se pudo buscar")
        return
      }

      // El back puede devolver un array direct
      // o o { futbolistas: [...] }
      const lista = Array.isArray(data) ? data : (data.palabras || data.tematicaImpostor || [])   // MODIFICADO: el back devuelve { palabras: [...] }

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
    setIdElegido(tematicaImpostor.id)   // AGREGADO
    setCategoria(tematicaImpostor.categoria)
    setResultados([])
  }

  // ---------- AGREGAR ----------
  async function agregar() {
    limpiarMensajes()

    if (!nombre || !categoria) {
      setError("Completá todos los datos")
      return
    }

    try {
      // MODIFICADO: POST con fetch directo, igual que en el registro (ruta nueva)
      const respuesta = await fetch(API + "/admin/palabras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nombre: nombre, categoria: categoria })
      })
      const data = await respuesta.json()
      const ok = respuesta.ok

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

  // ---------- EDITAR (AGREGADO) ----------
  async function editar() {
    limpiarMensajes()

    if (!idElegido) {
      setError("Buscá y elegí de la lista lo que querés editar")
      return
    }

    if (!nombre || !categoria) {
      setError("Completá todos los datos")
      return
    }

    try {
      // PUT con fetch directo, igual que en el registro
      const respuesta = await fetch(API + "/admin/palabras", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: idElegido, nombre: nombre, categoria: categoria })
      })
      const data = await respuesta.json()
      const ok = respuesta.ok

      if (ok) {
        setMensaje(data.mensaje || "se han guardado los cambios")
      } else {
        setError(data.mensaje || "No se pudo guardar")
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

    // AGREGADO: se elimina por id, así que hay que elegir la palabra de la lista
    if (!idElegido) {
      setError("Buscá y elegí de la lista lo que querés eliminar")
      return
    }

    try {
      // MODIFICADO: DELETE con fetch directo, igual que en el registro (antes era un POST con pedir)
      const respuesta = await fetch(API + "/admin/palabras", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: idElegido })
      })
      const data = await respuesta.json()
      const ok = respuesta.ok

      if (ok) {
        setMensaje(data.mensaje || "se ha eliminado correctamente")
        setCategoria("")
        setIdElegido(null)   // AGREGADO
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

        {/* AGREGADO: menú para elegir la temática */}
        <label className={styles.label}>Temática</label>
        <select
          className={styles.select}
          value={categoria}
          onChange={(e) => { setCategoria(e.target.value); setResultados([]); setIdElegido(null) }}
        >
          <option value="">Elegí una temática</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>

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

        <button className={styles.boton} onClick={editar}>
          Guardar cambios
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