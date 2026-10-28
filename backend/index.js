const express = require('express');						// Para el manejo del web server
const bodyParser = require('body-parser'); 				// Para el manejo de los strings JSON
const session = require('express-session');				// Para el manejo de las variables de sesión
const cors = require('cors');

// AGREGADO: conexión a la base de datos (para buscar el usuario en el login)
const { realizarQuery } = require('./modulos/mysql');


const app = express();                                  // Inicializo express para el manejo de las peticiones

// MODIFICADO: antes era app.use(cors());
// Para que el login pueda guardar la cookie de sesión, hay que indicar
// el origen del front y habilitar credentials. Con cors() solo, el navegador
// bloquea el login cuando el fetch usa credentials: "include".
app.use(cors({
	origin: ['http://localhost:3000', 'http://localhost:3001'],
	credentials: true
}));

app.use(bodyParser.urlencoded({ extended: false }));	// Inicializo el parser JSON
app.use(bodyParser.json());

const LISTEN_PORT = 4000;								// Puerto por el que estoy ejecutando la página Web

const server = app.listen(LISTEN_PORT, () => {
	console.log(`Servidor NodeJS corriendo en http://localhost:${LISTEN_PORT}/`);
});;

const io = require('socket.io')(server, {
	cors: {
		// IMPORTANTE: REVISAR PUERTO DEL FRONTEND
		//origin: ['http://localhost:3000',"http://localhost:3001"],            	// Permitir el origen localhost:3000
		origin: "*",
		methods: ["GET", "POST", "PUT", "DELETE"],  	// Métodos permitidos
		credentials: true                           	// Habilitar el envío de cookies
	}
});

const sessionMiddleware = session({
	//Elegir tu propia key secreta
	secret: "supersarasa",
	resave: false,
	saveUninitialized: false
});

app.use(sessionMiddleware);

io.use((socket, next) => {
	sessionMiddleware(socket.request, {}, next);
});

// A PARTIR DE ESTE PUNTO GENERAREMOS NUESTRO CÓDIGO (PARA RECIBIR PETICIONES, MANEJO DB, ETC.)
// A PARTIR DE ESTE PUNTO GENERAREMOS NUESTRO CÓDIGO (PARA RECIBIR PETICIONES, MANEJO DB, ETC.)
// A PARTIR DE ESTE PUNTO GENERAREMOS NUESTRO CÓDIGO (PARA RECIBIR PETICIONES, MANEJO DB, ETC.)
// A PARTIR DE ESTE PUNTO GENERAREMOS NUESTRO CÓDIGO (PARA RECIBIR PETICIONES, MANEJO DB, ETC.)
// A PARTIR DE ESTE PUNTO GENERAREMOS NUESTRO CÓDIGO (PARA RECIBIR PETICIONES, MANEJO DB, ETC.)
// A PARTIR DE ESTE PUNTO GENERAREMOS NUESTRO CÓDIGO (PARA RECIBIR PETICIONES, MANEJO DB, ETC.)
// A PARTIR DE ESTE PUNTO GENERAREMOS NUESTRO CÓDIGO (PARA RECIBIR PETICIONES, MANEJO DB, ETC.)
// A PARTIR DE ESTE PUNTO GENERAREMOS NUESTRO CÓDIGO (PARA RECIBIR PETICIONES, MANEJO DB, ETC.)
// A PARTIR DE ESTE PUNTO GENERAREMOS NUESTRO CÓDIGO (PARA RECIBIR PETICIONES, MANEJO DB, ETC.)

// -----------------------------------------------------------------------------
// AGREGADO: función para hacer consultas a la base de datos


// -----------------------------------------------------------------------------
// AGREGADO: LOGIN

async function handleLogin(req, res) {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).send({
			error: "DATOS_INCOMPLETOS",
			mensaje: "Debes enviar email y contraseña.",
		});
	}

	try {
		const buscarUsuario = await realizarQuery(
			"SELECT * FROM usuarios WHERE email = ?",
			[email]
		);

		if (buscarUsuario.length === 0) {
			return res.status(404).send({
				error: "USUARIO_NO_EXISTE",
				mensaje: "El usuario no existe. ¡Debes registrarte!",
			});
		}

		const usuarioValido = buscarUsuario[0];

		// Comparación directa en texto plano
		if (usuarioValido.password === password) {
			req.session.user = {
				idUsuario: usuarioValido.idUsuario,
				nickname: usuarioValido.nickname,
			};

			return res.send({
				loginExitoso: true,
				mensaje: "¡Ingreso exitoso!",
				usuario: req.session.user,
			});
		} else {
			return res.status(401).send({
				loginExitoso: false,
				error: "PASSWORD_INCORRECTA",
				mensaje: "La contraseña es incorrecta.",
			});
		}
	} catch (error) {
		console.log("Error en login:", error)   // se ve en la terminal del back
		return res.status(500).send({
			mensaje: "Error en la base de datos",
			error: error.message,
	});
}
}
app.post("/login", handleLogin);   // AGREGADO: ruta que usa el page del login

// -----------------------------------------------------------------------------
// De acá para abajo es tu código del chat, sin cambios

const listaMensajes = []
// Va a ser una LISTA DE OBJETOS. Cada objeto es 1 mensaje. Esto debería hacerce con una base de datos.
// IDEALEMENTE TENDRÍAMOS UNA LISTA DE MENSAJES PARA CADA SALA DISTINTA
// ESTO ES CÓDIGO HORRIBLE, NO RECREAR NUNCA
// La lista de mensajes tiene objetos de la siguiente forma
// { username: texto, mensaje: texto, room: texto, id: number }

// AGREGADO: información de turnos de cada sala
// Ejemplo: { "1": { jugadores: ["martin", "jose"], turno: 0 } }
// turno es la posición en la lista del jugador al que le toca
const salas = {}

// AGREGADO: reglas del juego del impostor
const MIN_JUGADORES = 3    // mínimo de jugadores para jugar
const RONDAS_PISTAS = 2    // cuántas pistas da cada jugador antes de votar

// AGREGADO: saca a un jugador de la lista de su sala y acomoda el turno
function sacarJugador(room, username) {
	const sala = salas[room]
	if (!sala) return

	const posicion = sala.jugadores.indexOf(username)
	if (posicion === -1) return

	sala.jugadores.splice(posicion, 1)

	// AGREGADO: limpio los datos del juego de este jugador
	if (sala.sockets) delete sala.sockets[username]

	if (sala.listos) {
		const posListo = sala.listos.indexOf(username)
		if (posListo !== -1) sala.listos.splice(posListo, 1)
	}

	if (sala.votos) {
		for (let i = sala.votos.length - 1; i >= 0; i--) {
			if (sala.votos[i].votante === username) sala.votos.splice(i, 1)
		}
	}

	// AGREGADO: si la sala quedó vacía se borra (así no queda una partida "empezada" fantasma)
	if (sala.jugadores.length === 0) {
		delete salas[room]
		return
	}

	// Si se fue alguien que estaba antes del turno actual, corro el turno uno para atrás
	if (posicion < sala.turno) sala.turno--
	// Si el turno quedó fuera de la lista, vuelve al primero
	if (sala.turno >= sala.jugadores.length) sala.turno = 0

	io.to(room).emit("turno", { jugador: sala.jugadores[sala.turno] || "" })

	// AGREGADO: acomodo el juego del impostor
	if (sala.fase && sala.fase !== "pistas") {
		io.to(room).emit("turno", { jugador: "" })   // solo hay turno durante las pistas
	}

	if (sala.fase === "pistas" || sala.fase === "votacion") {
		if (username === sala.impostor || sala.jugadores.length < MIN_JUGADORES) {
			cancelarPartida(room)    // se fue el impostor o quedaron pocos jugadores
		} else if (sala.fase === "votacion" && sala.votos.length >= sala.jugadores.length) {
			contarVotos(room)        // ya votaron todos los que quedan
		}
	} else if (sala.fase === "espera") {
		avisarListos(room)
	}
}

// AGREGADO: avisa a la sala cuántos jugadores apretaron "Estoy listo"
function avisarListos(room) {
	const sala = salas[room]
	if (!sala) return

		io.to(room).emit("estadoListos", { listos: sala.listos, total: sala.jugadores.length, minimo: MIN_JUGADORES })
}

// AGREGADO: sortea la palabra y el impostor con Math.random y le manda a cada uno SOLO lo suyo
async function empezarPartida(room) {
	const sala = salas[room]
	if (!sala || sala.fase !== "espera") return

	sala.fase = "pistas"   // se marca primero para que no arranque dos veces
	sala.listos = []

	// Traigo todas las palabras de la base
	let palabras = []
	try {
		palabras = await realizarQuery("SELECT nombre, categoria FROM tematicaImpostor")
	} catch (error) {
		console.log("Error al traer las palabras:", error)
	}

	if (palabras.length === 0) {
		sala.fase = "espera"
		io.to(room).emit("errorPartida", { mensaje: "No hay palabras cargadas en la base" })
		return
	}

	// Sorteo de la palabra: posición al azar entre 0 y palabras.length - 1
	const posicionPalabra = Math.floor(Math.random() * palabras.length)
	sala.palabra = palabras[posicionPalabra].nombre
	sala.categoria = palabras[posicionPalabra].categoria

	// Sorteo del impostor: posición al azar entre los jugadores de la sala
	const posicionImpostor = Math.floor(Math.random() * sala.jugadores.length)
	sala.impostor = sala.jugadores[posicionImpostor]

	sala.turno = 0
	sala.pistas = 0
	sala.votos = []

	// Las pistas de partidas anteriores se "archivan" cambiándoles la sala (así no se mezclan con la nueva)
	for (let i = 0; i < listaMensajes.length; i++) {
		if (listaMensajes[i].room == room) {
			listaMensajes[i].room = room + " (partida anterior)"
		}
	}
	io.to(room).emit("respuestaServidor", [])

	// IMPORTANTE: cada uno recibe su rol por su propio socket (nunca con io.to(room))
	for (let i = 0; i < sala.jugadores.length; i++) {
		const nombre = sala.jugadores[i]
		const idSocket = sala.sockets[nombre]

		if (nombre === sala.impostor) {
			io.to(idSocket).emit("rol", { rol: "impostor", categoria: sala.categoria })
		} else {
			io.to(idSocket).emit("rol", { rol: "normal", categoria: sala.categoria, palabra: sala.palabra })
		}
	}

	io.to(room).emit("faseJuego", { fase: "pistas" })
	io.to(room).emit("turno", { jugador: sala.jugadores[0] })
}

// AGREGADO: cuenta los votos, avisa el resultado y vuelve a la sala de espera
function contarVotos(room) {
	const sala = salas[room]
	if (!sala) return

	let masVotado = ""
	let maxVotos = 0
	let empate = false

	// Para cada jugador cuento cuántos votos recibió
	for (let i = 0; i < sala.jugadores.length; i++) {
		const candidato = sala.jugadores[i]
		let cantidad = 0

		for (let j = 0; j < sala.votos.length; j++) {
			if (sala.votos[j].votado === candidato) cantidad++
		}

		if (cantidad > maxVotos) {
			maxVotos = cantidad
			masVotado = candidato
			empate = false
		} else if (cantidad === maxVotos && cantidad > 0) {
			empate = true
		}
	}

	// Si descubren al impostor ganan los normales. Si no (o hay empate) gana el impostor
	let ganador = "impostor"
	if (!empate && masVotado === sala.impostor) {
		ganador = "normales"
	}

	if (empate) masVotado = ""

	io.to(room).emit("resultado", {
		impostor: sala.impostor,
		palabra: sala.palabra,
		masVotado: masVotado,
		ganador: ganador
	})

	volverASalaDeEspera(room)
}

// AGREGADO: corta la partida (por ejemplo si se va el impostor)
function cancelarPartida(room) {
	const sala = salas[room]
	if (!sala) return

	io.to(room).emit("resultado", {
		impostor: sala.impostor,
		palabra: sala.palabra,
		masVotado: "",
		ganador: "nadie (se fue un jugador)"
	})

	volverASalaDeEspera(room)
}

// AGREGADO: deja la sala lista para jugar otra partida
function volverASalaDeEspera(room) {
	const sala = salas[room]

	sala.fase = "espera"
	sala.listos = []
	sala.votos = []
	sala.pistas = 0
	sala.turno = 0

	io.to(room).emit("turno", { jugador: "" })
	avisarListos(room)
}

// Cuando cualquier persona (socket) se conecte...
io.on("connection", (socket) => {

	// Decidimos qué hacer con cada persona (socket)
	const req = socket.request;
	console.log("Cliente conectado")

	// AGREGADO: nombre con el que este socket se anotó en los turnos
	let miUsername = ""

	// Asignar room predeterminada si no está en ninguna room
	if (!req.session.room) {
		req.session.room = "1"; 		// Room predeterminada
		socket.join(req.session.room);	// Envía al socket a "1"
	}

	// Este evento recibe un objeto cuyas claves DEBEN incluír room
	// Por ejemplo { room: "1" }
	socket.on('joinRoom', data => {

		// AGREGADO: no se puede entrar a una sala donde la partida ya empezó
		if (salas[data.room] && salas[data.room].fase && salas[data.room].fase !== "espera") {
			socket.emit("errorPartida", { mensaje: "La partida ya empezó, esperá a que termine" })
			return
		}

		// AGREGADO: si ya estaba anotado en otra sala, lo saco de esa lista de turnos
		if (miUsername) sacarJugador(req.session.room, miUsername)

		// socket.leave para salir de la room actual
		if (req.session.room != undefined && req.session.room.length > 0) { socket.leave(req.session.room); }

		req.session.room = data.room;
		// Envía al socket a la room recibida por data.room
		socket.join(req.session.room);

		console.log("El socket ahora está en la room:", req.session.room)

		// AGREGADO: anoto al jugador en la lista de la sala (si no estaba)
		miUsername = data.username
		if (!salas[data.room]) salas[data.room] = { jugadores: [], turno: 0 }
		if (!salas[data.room].jugadores.includes(data.username)) {
			salas[data.room].jugadores.push(data.username)
		}

		// AGREGADO: datos del juego del impostor (solo la primera vez que se crea la sala)
		if (!salas[data.room].fase) {
			salas[data.room].sockets = {}      // { nombre: idDelSocket }, para mandar mensajes privados
			salas[data.room].fase = "espera"   // "espera" | "pistas" | "votacion"
			salas[data.room].impostor = ""
			salas[data.room].palabra = ""
			salas[data.room].categoria = ""
			salas[data.room].pistas = 0
			salas[data.room].votos = []        // [{ votante, votado }]
			salas[data.room].listos = []       // nombres de los que apretaron "Estoy listo"
		}
		salas[data.room].sockets[data.username] = socket.id

		// AGREGADO: aviso a toda la sala de quién es el turno
		io.to(data.room).emit("turno", { jugador: salas[data.room].jugadores[salas[data.room].turno] })

		// AGREGADO: en la sala de espera no hay turno; aviso cuántos están listos
		io.to(data.room).emit("turno", { jugador: "" })
		avisarListos(data.room)
	});

	// Cada vez que UNA persona me envía un mensaje, le mando una respuestaServidor a TODOS
	socket.on("mensaje", (data) => {

		// Variable que contiene la sala a la que pertenece el socket actual
		const room = req.session.room

		// AGREGADO: si no es el turno de quien mandó el mensaje, lo ignoro
		const sala = salas[room]
		if (!sala || sala.jugadores[sala.turno] !== data.username) return

		// AGREGADO: solo se dan pistas durante la fase de pistas y desde el socket del propio jugador
		if (sala.fase !== "pistas") return
		if (sala.sockets[data.username] !== socket.id) return

		// data tiene claves username y mensaje

		//io.emit("respuestaServidor", { mensaje: data.mensaje })

		listaMensajes.push( { mensaje: data.mensaje, username: data.username, room: room, id: listaMensajes.length } )

		// Emitimos a toda la room un evento que contenga los 3 datos relevantes
		io.to(room).emit("respuestaServidor", listaMensajes.filter( (mensaje) => { return mensaje.room == room } ) )

		// AGREGADO: cuando todos dieron sus pistas (RONDAS_PISTAS rondas) pasan a votar
		sala.pistas++
		if (sala.pistas >= sala.jugadores.length * RONDAS_PISTAS) {
			sala.fase = "votacion"
			sala.votos = []
			io.to(room).emit("faseJuego", { fase: "votacion", jugadores: sala.jugadores })
			io.to(room).emit("turno", { jugador: "" })
			return
		}

		// AGREGADO: paso el turno al siguiente jugador
		sala.turno++
		if (sala.turno >= sala.jugadores.length) sala.turno = 0   // terminó la ronda: vuelve al primero
		io.to(room).emit("turno", { jugador: sala.jugadores[sala.turno] })

	})

	// AGREGADO: el jugador avisa que está listo. Cuando están TODOS listos, arranca la partida
	socket.on("listo", (data) => {
		const room = req.session.room
		const sala = salas[room]
		if (!sala || sala.fase !== "espera") return
		if (sala.sockets[data.username] !== socket.id) return   // solo puede marcarse listo a sí mismo

		if (!sala.listos.includes(data.username)) {
			sala.listos.push(data.username)
		}
		avisarListos(room)

		if (sala.jugadores.length < MIN_JUGADORES) {
			socket.emit("errorPartida", { mensaje: "Se necesitan al menos " + MIN_JUGADORES + " jugadores" })
			return
		}

		// Arranca solo cuando todos apretaron "Estoy listo"
		if (sala.listos.length === sala.jugadores.length) {
			empezarPartida(room)
		}
	})

	// AGREGADO: voto de cada jugador. Cuando votaron todos se cuenta
	socket.on("votar", (data) => {
		const room = req.session.room
		const sala = salas[room]
		if (!sala || sala.fase !== "votacion") return
		if (sala.sockets[data.votante] !== socket.id) return    // solo vota por sí mismo
		if (!sala.jugadores.includes(data.votado)) return       // el votado tiene que existir
		if (data.votante === data.votado) return                // no se puede votar a uno mismo

		// Si ya había votado, le cambio el voto. Si no, lo agrego
		let yaVoto = false
		for (let i = 0; i < sala.votos.length; i++) {
			if (sala.votos[i].votante === data.votante) {
				sala.votos[i].votado = data.votado
				yaVoto = true
			}
		}
		if (!yaVoto) {
			sala.votos.push({ votante: data.votante, votado: data.votado })
		}

		io.to(room).emit("progresoVotos", { votaron: sala.votos.length, total: sala.jugadores.length })

		// Cuando votaron todos, se cuenta
		if (sala.votos.length >= sala.jugadores.length) {
			contarVotos(room)
		}
	})

	// AGREGADO: si alguien se va, lo saco de la lista para que el juego no se trabe
	socket.on("disconnect", () => {
		if (miUsername) sacarJugador(req.session.room, miUsername)
	})

});

// -----------------------------------------------------------------------------
// AGREGADO: REGISTRO

async function handleRegister(req, res) {
	const { nickname, email, password } = req.body;

	if (!nickname || !email || !password) {
		return res.status(400).send({
			registroExitoso: false,
			mensaje: "Debes enviar nombre, email y contraseña.",
		});
	}

	try {
		// Si el email ya existe, no se puede registrar de nuevo
		const existente = await realizarQuery(
			"SELECT * FROM usuarios WHERE email = ?",
			[email]
		);

		if (existente.length > 0) {
			return res.status(409).send({
				registroExitoso: false,
				mensaje: "Este correo ya está registrado",
			});
		}

		// La tabla no usa auto_increment: el id nuevo es el máximo + 1
		const maximo = await realizarQuery("SELECT MAX(idUsuario) AS maxId FROM usuarios");
		const nuevoId = (maximo[0].maxId || 0) + 1;

		await realizarQuery(
			"INSERT INTO usuarios (idUsuario, nickname, email, password, victorias) VALUES (?, ?, ?, ?, 0)",
			[nuevoId, nickname, email, password]
		);

		return res.send({
			registroExitoso: true,
			mensaje: "Registro exitoso",
		});
	} catch (error) {
		console.log("Error en registro:", error)
		return res.status(500).send({
			registroExitoso: false,
			mensaje: "No se pudo registrar el usuario",
		});
	}
}
app.post("/register", handleRegister);