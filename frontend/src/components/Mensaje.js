import React from 'react'

// Conecta el componente con su archivo de estilos
import styles from './Mensaje.module.css'

// Recibe por props:
// - username: quién mandó la pista
// - mensaje: el texto de la pista
// - esMio: true si la mandé yo (se muestra a la derecha y en rojo)
function Mensaje({ username, mensaje, esMio }) {
  return (
    <div className={`${styles.burbuja} ${esMio ? styles.mio : styles.ajeno}`}>
      <span className={styles.username}>{username || "Anónimo"}</span>
      {mensaje}
    </div>
  )
}

export default Mensaje