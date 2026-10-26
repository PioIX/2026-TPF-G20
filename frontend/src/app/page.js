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