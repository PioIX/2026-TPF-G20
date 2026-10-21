const express = require('express');						// Para el manejo del web server
const bodyParser = require('body-parser'); 				// Para el manejo de los strings JSON
const session = require('express-session');				// Para el manejo de las variables de sesión
const cors = require('cors');

// AGREGADO: conexión a la base de datos (para buscar el usuario en el login)
const pool = require('./modulos/mysql');


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

async function realizarQuery(sql, params = []) {
	const [rows] = await pool.query(sql, params);
	return rows;
}

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

// Cuando cualquier persona (socket) se conecte...
io.on("connection", (socket) => {

	// Decidimos qué hacer con cada persona (socket)
	const req = socket.request;
	console.log("Cliente conectado")

	// Asignar room predeterminada si no está en ninguna room
	if (!req.session.room) {
		req.session.room = "1"; 		// Room predeterminada
		socket.join(req.session.room);	// Envía al socket a "1"
	}

	// Este evento recibe un objeto cuyas claves DEBEN incluír room
	// Por ejemplo { room: "1" }
	socket.on('joinRoom', data => {

		// socket.leave para salir de la room actual
		if (req.session.room != undefined && req.session.room.length > 0) { socket.leave(req.session.room); }

		req.session.room = data.room;
		// Envía al socket a la room recibida por data.room
		socket.join(req.session.room);

		console.log("El socket ahora está en la room:", req.session.room)
	});

	// Cada vez que UNA persona me envía un mensaje, le mando una respuestaServidor a TODOS
	socket.on("mensaje", (data) => {

		// Variable que contiene la sala a la que pertenece el socket actual
		const room = req.session.room

		// data tiene claves username y mensaje

		//io.emit("respuestaServidor", { mensaje: data.mensaje })

		listaMensajes.push( { mensaje: data.mensaje, username: data.username, room: room, id: listaMensajes.length } )

		// Emitimos a toda la room un evento que contenga los 3 datos relevantes
		io.to(room).emit("respuestaServidor", listaMensajes.filter( (mensaje) => { return mensaje.room == room } ) )

	})

});