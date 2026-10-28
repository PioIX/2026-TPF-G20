"use client"

import React from 'react'

import Mensaje from '@/components/Mensaje'

import { useEffect, useState } from 'react'

import { useSocket } from '@/hooks/useSocket'

// Esta línea conecta la página con su archivo de estilos.
// "styles" es un objeto con todas las clases de page.module.css
// y se usa así: className={styles.nombreDeLaClase}
import styles from './page.module.css'

/*
    Pasos para hacer el setup de sockets en el front:
    1) Asegurarse de tener el archivo useSocket.js en la carpeta src/hooks/
    2) Dentro del archivo useSocket.js, debemos cambiar el serverUrl del backend al backend que estemos usando
    3) Dentro de la página que use los sockets, debemos importar el hook useSocket
    4) Dentro del componente poner la línea:
          const { socket, isConnected } = useSocket();

    Recibir eventos en el front:
    1) Importar useEffect desde react
    2) Copiar y pegar lo siguiente:

      useEffect(
        () => {

          if (!socket) return;
          //aca pongo los socket.on

        },
        [socket]);

    Emitir eventos en el front:
    1) Dentro de algún callback de click o algo por el estilo ponemos socket.emit( nombre, data )
*/

/*
    Conditional rendering:

    { condicion && renderizado }                          Muestra el renderizado si condicion es true
    { condicion ? renderizadoTrue : renderizadoFalse }    Muestra uno u el otro según el valor de la condición
*/

function Home() {

  const { socket, isConnected } = useSocket();

  const [texto, setTexto] = useState("")
  const [textoRoom, setTextoRoom] = useState("")
  const [textoUsername, setTextoUsername] = useState("")
  const [listaMensajes, setListaMensajes] = useState([])
  const [turnoDe, setTurnoDe] = useState("")   // AGREGADO: nombre del jugador al que le toca

  // AGREGADO: estados del juego del impostor
  const [fase, setFase] = useState("espera")                    // "espera" | "pistas" | "votacion"
  const [miRol, setMiRol] = useState(null)                      // { rol, categoria, palabra } (solo lo ve cada uno)
  const [listos, setListos] = useState([])                      // nombres de los que apretaron "Estoy listo"
  const [totalJugadores, setTotalJugadores] = useState(0)
  const [minimoJugadores, setMinimoJugadores] = useState(3)      // mínimo para empezar (lo manda el servidor)       // jugadores en la sala (0 = todavía no entró a una)
  const [jugadoresVotacion, setJugadoresVotacion] = useState([])
  const [yaVote, setYaVote] = useState(false)
  const [progresoVotos, setProgresoVotos] = useState({ votaron: 0, total: 0 })
  const [resultado, setResultado] = useState(null)              // { impostor, palabra, masVotado, ganador }

  useEffect(
    () => {
      if (!socket) return;
      
      socket.on("respuestaServidor", (data) => {

        console.log(data)
        setListaMensajes(data)

      });

      // AGREGADO: el servidor avisa de quién es el turno
      socket.on("turno", (data) => {
        setTurnoDe(data.jugador)
      });

      // AGREGADO: cuántos están listos en la sala de espera
      socket.on("estadoListos", (data) => {
        setListos(data.listos)
        setTotalJugadores(data.total)
        setMinimoJugadores(data.minimo)
      });

      // AGREGADO: llega mi rol (solo a mí). Empieza una partida nueva
      socket.on("rol", (data) => {
        setMiRol(data)
        setResultado(null)
        setYaVote(false)
        setProgresoVotos({ votaron: 0, total: 0 })
      });

      // AGREGADO: cambio de fase (pistas -> votación)
      socket.on("faseJuego", (data) => {
        setFase(data.fase)
        if (data.jugadores) setJugadoresVotacion(data.jugadores)
      });

      // AGREGADO: cuántos votaron
      socket.on("progresoVotos", (data) => {
        setProgresoVotos(data)
      });

      // AGREGADO: terminó la partida
      socket.on("resultado", (data) => {
        setResultado(data)
        setFase("espera")
        setMiRol(null)
        setYaVote(false)
      });

      // AGREGADO: errores del juego (poca gente, partida empezada, etc.)
      socket.on("errorPartida", (data) => {
        alert(data.mensaje)
      });

    },
    [socket]
  );

  return (
    <div className={styles.fondo}>
      <div className={styles.chat}>

        {/* ---------- Header: título y estado de conexión ---------- */}
        <div className={styles.header}>
          <h1 className={styles.titulo}>Impostor</h1>

          <div className={styles.estado}>
            <span className={`${styles.punto} ${isConnected ? styles.conectado : styles.desconectado}`}></span>
            {isConnected ? "conexion con usuarios exitosa" : "Error"}
          </div>
        </div>

        {/* ---------- Nombre y sala ---------- */}
        <div className={styles.config}>
          <input
            className={styles.input}
            type='text'
            placeholder='ingrese nombre'
            onChange={ (e) => { setTextoUsername(e.target.value) } }
          ></input>

          <input
            className={styles.input}
            type='text'
            placeholder='ingrese Sala'
            onChange={ (e) => { setTextoRoom(e.target.value) } }
          ></input>

          {/* MODIFICADO: el joinRoom de abajo ahora también manda username */}
          <button
            className={styles.botonSecundario}
            onClick={ () => { socket.emit("joinRoom", { room: textoRoom, username: textoUsername }) } }
          >CambiarSala</button>
        </div>

        {/* ---------- AGREGADO: sala de espera (aparece cuando ya entraste a una sala) ---------- */}
        {fase === "espera" && totalJugadores > 0 && (
          <div className={styles.rol}>
            <p>Listos: {listos.length} / {totalJugadores}</p>
            {totalJugadores < minimoJugadores && <p>Se necesitan al menos {minimoJugadores} jugadores para empezar</p>}
            <button
              className={styles.boton}
              disabled={listos.includes(textoUsername) || totalJugadores < minimoJugadores}
              onClick={ () => { socket.emit("listo", { username: textoUsername }) } }
            >{listos.includes(textoUsername) ? "Esperando al resto..." : "Estoy listo"}</button>
          </div>
        )}

        {/* ---------- AGREGADO: mi rol (cada uno ve solo el suyo) ---------- */}
        {miRol && (
          <div className={styles.rol}>
            {miRol.rol === "impostor"
              ? <p>Sos el <b>IMPOSTOR</b>. Categoría: <b>{miRol.categoria}</b>. Disimulá.</p>
              : <p>Categoría: <b>{miRol.categoria}</b>. Tu palabra es: <b>{miRol.palabra}</b></p>}
          </div>
        )}

        {/* ---------- AGREGADO: votación ---------- */}
        {fase === "votacion" && !yaVote && (
          <div className={styles.rol}>
            <p>¿Quién es el impostor?</p>
            {jugadoresVotacion
              .filter((nombre) => nombre !== textoUsername)
              .map((nombre) => (
                <button
                  key={nombre}
                  className={styles.botonSecundario}
                  onClick={ () => { socket.emit("votar", { votante: textoUsername, votado: nombre }); setYaVote(true) } }
                >{nombre}</button>
              ))}
          </div>
        )}
        {fase === "votacion" && yaVote && (
          <div className={styles.rol}>
            <p>Esperando al resto de los votos... ({progresoVotos.votaron} / {progresoVotos.total})</p>
          </div>
        )}

        {/* ---------- AGREGADO: resultado de la partida ---------- */}
        {resultado && (
          <div className={styles.rol}>
            <p>El impostor era: <b>{resultado.impostor}</b></p>
            <p>La palabra era: <b>{resultado.palabra}</b></p>
            {resultado.masVotado && <p>El más votado fue: <b>{resultado.masVotado}</b></p>}
            <p>Ganaron: <b>{resultado.ganador}</b></p>
          </div>
        )}

        {/* ---------- Lista de mensajes ---------- */}
        <div className={styles.mensajes}>
          {
            listaMensajes.map(
                            (objetoMensaje) => <Mensaje username={objetoMensaje.username} mensaje={objetoMensaje.mensaje} key={objetoMensaje.id} esMio={objetoMensaje.username === textoUsername} />
            )
          }
        </div>

        {/* AGREGADO: cartel de turno */}
        <p className={styles.turno}>
          {turnoDe === textoUsername ? "¡Es tu turno!" : turnoDe ? `Turno de ${turnoDe}` : "Unite a una sala para jugar"}
        </p>

        {/* ---------- Barra para escribir ---------- */}
        {/* AGREGADO: el input y el botón tienen disabled (bloqueados si no es tu turno) */}
        <div className={styles.enviar}>
          <input
            className={styles.input}
            type='text'
            placeholder='ingrese texto'
            disabled={turnoDe !== textoUsername}
            onChange={ (e) => { setTexto(e.target.value) } }
          ></input>

          <button
            className={styles.boton}
            disabled={turnoDe !== textoUsername}
            onClick={ () => { socket.emit("mensaje", { mensaje: texto, username: textoUsername }) } }
          >Enviar</button>
        </div>

      </div>
    </div>
  )
}

export default Home