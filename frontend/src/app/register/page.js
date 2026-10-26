"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Usa el mismo css que el login
import styles from '../login/page.module.css'

function Register() {

  const router = useRouter()

  const [nickname, setNickname] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function registrarse() {
    setError("")

    if (!nickname || !email || !password) {
      setError("Completá nombre, email y contraseña")
      return
    }

    try {
      const respuesta = await fetch("http://localhost:4000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname, email: email, password: password })
      })

      const data = await respuesta.json()

      if (data.registroExitoso) {
        alert("Registro exitoso")
        router.push("/login")   // después del alert, vuelve al login
      } else {
        setError(data.mensaje)  // por ejemplo: "Este correo ya está registrado"
      }
    } catch (e) {
      console.log("Error en el fetch:", e)
      setError("No se pudo conectar con el servidor")
    }
  }

  return (
    <div className={styles.fondo}>
      <div className={styles.tarjeta}>

        <h1 className={styles.titulo}>Impostor</h1>
        <p className={styles.subtitulo}>Creá tu cuenta para jugar</p>

        <input
          className={styles.input}
          type='text'
          placeholder='Nombre'
          onChange={(e) => { setNickname(e.target.value) }}
        ></input>

        <input
          className={styles.input}
          type='email'
          placeholder='Email'
          onChange={(e) => { setEmail(e.target.value) }}
        ></input>

        <input
          className={styles.input}
          type='password'
          placeholder='Contraseña'
          onChange={(e) => { setPassword(e.target.value) }}
          onKeyDown={(e) => { if (e.key === "Enter") registrarse() }}
        ></input>

        {/* Solo se muestra si hay un error */}
        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.boton} onClick={registrarse}>
          Registrarse
        </button>

        {/* Link para volver al login */}
        <p className={styles.subtitulo}>
          ¿Ya tenés cuenta? <Link href="/login" className={styles.link}>Iniciá sesión</Link>
        </p>

      </div>
    </div>
  )
}

export default Register