"use client"

import React from 'react'

import { useState, useEffect } from 'react'

function InputTexto() {

    const [texto, setTexto] = useState("")

    //console.log("Codigo suelto")

    useEffect(
        () => {                             //  Callback (Cada vez que algo dentro del array de dependencias cambia se ejecuta)
            console.log("Codigo seguro")
        },
        []                                  //  Array de dependencias
    )

    return (

        <div>

            Tu variable es: {texto}

            <br/>

            <input
                type='text'
                onChange={ (e) => { setTexto(e.target.value) } }
            ></input>

        </div>

    )
}

export default InputTexto
