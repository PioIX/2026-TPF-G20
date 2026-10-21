
const express = require('express');						// Para el manejo del web server
const bodyParser = require('body-parser'); 				// Para el manejo de los strings JSON
const session = require('express-session');				// Para el manejo de las variables de sesión
const cors = require('cors');


const app = express();                                  // Inicializo express para el manejo de las peticiones

app.use(cors());            							// Inicializo express para el manejo de las peticiones

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
async function realizarQuery(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function obtenerSiguienteId(tabla, columna) {
  const resultado = await realizarQuery(
    `SELECT MAX(${columna}) as maxId FROM ${tabla}`
  );
  return (resultado[0].maxId || 0) + 1;
}

// Guarda una partida terminada en juegos + usuarioXjuego
async function guardarJuego(
  idUsuario1,
  idUsuario2,
  puntosJ1,
  puntosJ2,
  a30puntos,
  conFlor
) {
  const idJuego = await obtenerSiguienteId("juegos", "idJuego");

  await realizarQuery(
    "INSERT INTO juegos (idJuego, puntosJ1, puntosJ2, a30puntos, conFlor) VALUES (?, ?, ?, ?, ?)",
    [idJuego, puntosJ1, puntosJ2, a30puntos, conFlor]
  );

  await realizarQuery(
    "INSERT INTO usuarioXjuego (idJuego, idUsuario1, idUsuario2) VALUES (?, ?, ?)",
    [idJuego, idUsuario1, idUsuario2]
  );

  return idJuego;
}

// -----------------------------------------------------------------------------
//

const ORIGENES_PERMITIDOS = ["http://localhost:3000", "http://localhost:3001"];

app.use(cors({ origin: ORIGENES_PERMITIDOS, credentials: true }));
app.use(express.json());

const sessionMiddleware = session({
  secret: "TITANFALL2",
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: "lax",
    secure: false,
  },
});
app.use(sessionMiddleware);

function requiereSesion(req, res, next) {
  if (!req.session.user) {
    return res.status(401).send({
      error: "NO_AUTENTICADO",
      mensaje: "Debes iniciar sesión.",
    });
  }
  next();
}

// -----------------------------------------------------------------------------

const server = app.listen(PORT, () => {
  console.log(`Servidor NodeJS corriendo en http://localhost:${PORT}/`);
});

const io = new Server(server, {
  cors: {
    origin: ORIGENES_PERMITIDOS,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// -----------------------------------------------------------------------------

const salas = {}; // { "sala1": [{ idUsuario, nickname }, ...], ... }
const MAX_JUGADORES = 2;
let contadorSalas = 1;

// Devuelve una sala con lugar libre, o crea una nueva
function buscarSalaLibre() {
  for (const nombre in salas) {
    if (salas[nombre].length < MAX_JUGADORES) return nombre;
  }
  const nueva = "sala" + contadorSalas;
  contadorSalas++;
  salas[nueva] = [];
  return nueva;
}

// Devuelve true si el usuario ya está en alguna sala
function usuarioYaEnSala(idUsuario) {
  for (const nombre in salas) {
    if (salas[nombre].some((j) => j.idUsuario === idUsuario)) return true;
  }
  return false;
}

io.on("connection", (socket) => {
  const req = socket.request;

  // El jugador pide sala después de iniciar sesión
  socket.on("buscarSala", () => {
    const usuario = req.session.user;

    if (!usuario) {
      return socket.emit("errorSala", { mensaje: "Debes iniciar sesión." });
    }
    if (socket.data.room) return; // Este socket ya tiene sala
    if (usuarioYaEnSala(usuario.idUsuario)) {
      return socket.emit("errorSala", { mensaje: "Ya estás en una partida." });
    }

    const sala = buscarSalaLibre();
    salas[sala].push({
      idUsuario: usuario.idUsuario,
      nickname: usuario.nickname,
    });

    socket.data.room = sala;
    socket.data.idUsuario = usuario.idUsuario;
    socket.join(sala);

    socket.emit("salaAsignada", { room: sala });
    io.to(sala).emit("jugadoresSala", salas[sala]);

    // Si la sala se llenó, arranca la partida
    if (salas[sala].length === MAX_JUGADORES) {
      io.to(sala).emit("empiezaPartida", { jugadores: salas[sala] });
    }
  });

  socket.on("disconnect", () => {
    const sala = socket.data.room;
    if (!sala || !salas[sala]) return;

    salas[sala] = salas[sala].filter(
      (j) => j.idUsuario !== socket.data.idUsuario
    );

    if (salas[sala].length === 0) {
      delete salas[sala]; // Sala vacía: se borra
    } else {
      io.to(sala).emit("rivalDesconectado", salas[sala]); // Avisamos al que quedó
    }
  });
});

// -----------------------------------------------------------------------------
// RUTAS: AUTENTICACIÓN Y USUARIOS

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

async function handleRegister(req, res) {
  const { nickname, email, password } = req.body;

  if (!nickname || !email || !password) {
    return res.status(400).send({
      registroExitoso: false,
      mensaje: "Debes enviar nickname, email y contraseña.",
    });
  }

  try {
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

    const nextId = await obtenerSiguienteId("usuarios", "idUsuario");

    // Guarda la contraseña directamente sin cifrar
    await realizarQuery(
      "INSERT INTO usuarios (idUsuario, nickname, email, password) VALUES (?, ?, ?, ?)",
      [nextId, nickname, email, password]
    );

    res.send({
      registroExitoso: true,
      mensaje: "Usuario creado con éxito. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    res.status(500).send({
      registroExitoso: false,
      mensaje: "No se pudo registrar el usuario",
      error: error.message,
    });
  }
}

// Rutas pedidas por la consigna
app.post("/login", handleLogin);
app.post("/register", handleRegister);

// -----------------------------------------------------------------------------
// RUTAS: ESTADÍSTICAS
app.get("/cartas", async function (req, res) {
  try {
    let respuesta = await realizarQuery("SELECT * FROM cartas;");
    res.send({ cartas: respuesta });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});
/*
app.get("/juegos", requiereSesion, async function (req, res) {
  const id = req.session.user.idUsuario;

  try {
    const resultado = await realizarQuery(
      `SELECT
         SUM((uxj.idUsuario1 = ? AND j.puntosJ1 > j.puntosJ2) OR
             (uxj.idUsuario2 = ? AND j.puntosJ2 > j.puntosJ1)) AS victorias,
         SUM((uxj.idUsuario1 = ? AND j.puntosJ1 < j.puntosJ2) OR
             (uxj.idUsuario2 = ? AND j.puntosJ2 < j.puntosJ1)) AS derrotas
       FROM juegos j
       JOIN usuarioXjuego uxj ON uxj.idJuego = j.idJuego
       WHERE uxj.idUsuario1 = ? OR uxj.idUsuario2 = ?`,
      [id, id, id, id, id, id]
    );

    res.send({
      victorias: Number(resultado[0].victorias) || 0,
      derrotas: Number(resultado[0].derrotas) || 0,
    });
  } catch (error) {
    res.status(500).send({
      mensaje: "No se pudieron obtener las estadísticas",
      error: error.message,
    });
  }
});
*/

//--------------------------login--------------------------------------------------
app.post("/api/login", async function (req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({
      error: "DATOS_INCOMPLETOS",
      mensaje: "Debes enviar email y password.",
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
    let passwordCorrecta = false;

    if (usuarioValido.password.startsWith("$2")) {
      passwordCorrecta = await bcrypt.compare(password, usuarioValido.password);
    } else {
      passwordCorrecta = usuarioValido.password === password;
      if (passwordCorrecta) {
        try {
          const nuevoHash = await bcrypt.hash(password, 10);
          await realizarQuery(
            "UPDATE usuarios SET password = ? WHERE idUsuario = ?",
            [nuevoHash, usuarioValido.idUsuario]
          );
        } catch (migrationError) {
          console.log("Error al migrar hash:", migrationError.message);
        }
      }
    }

    if (passwordCorrecta) {
      // 3. SESIÓN GUARDADA AHORA EN /api/login
      req.session.user = {
        idUsuario: usuarioValido.idUsuario,
        nickname: usuarioValido.nickname,
      };

      res.send({
        loginExitoso: true,
        mensaje: "¡Ingreso exitoso!",
        usuario: req.session.user,
      });
    } else {
      res.status(401).send({
        loginExitoso: false,
        error: "PASSWORD_INCORRECTA",
        mensaje: "La contraseña es incorrecta.",
      });
    }
  } catch (error) {
    res
      .status(500)
      .send({ mensaje: "Error en la base de datos", error: error.message });
  }
});
