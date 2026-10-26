"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

// Conecta la página con su archivo de estilos
import styles from './page.module.css'

function Login() {

  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function iniciarSesion() {
    setError("")
f
    try {
      const respuesta = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",   // IMPORTANTE: sin esto no se guarda la cookie de sesión
        body: JSON.stringify({ email: email, password: password })
      })

      const data = await respuesta.json()

      if (data.loginExitoso) {
        router.push("http://localhost:3000")   // si salió bien, va a la página del juego
      } else {
        setError(data.mensaje)   // muestra el mensaje que manda el back
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
        <p className={styles.subtitulo}>Iniciá sesión para jugar</p>

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
          onKeyDown={(e) => { if (e.key === "Enter") iniciarSesion() }}
        ></input>

        {/* Solo se muestra si hay un error */}
        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.boton} onClick={iniciarSesion}>
          Ingresar
        </button>

      </div>
    </div>
  )
}

export default Login