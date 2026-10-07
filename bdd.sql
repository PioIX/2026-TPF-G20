DROP TABLE IF EXISTS juegos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS cartas;

CREATE TABLE usuarios (
    idUsuario int primary key,
    nickname varchar(1000),
    email varchar(1000),
    `password` varchar(1000)
);

CREATE TABLE juegos (
	idJuego int primary key,
    idUsuario1 int,
    idUsuario2 int,
    puntosJ1 int,
    puntosJ2 int,
    a30puntos bool,
    conFlor bool,
    foreign key(idUsuario1) references usuarios(idUsuario),
    foreign key(idUsuario2) references usuarios(idUsuario)
);

CREATE TABLE cartas (
idCarta int primary key,
numero int,
palo varchar(1000),
valor int
);

INSERT INTO cartas (idCarta, numero, palo, valor) VALUES
(1, 1, 'Espadas', 14), 
(2, 2, 'Espadas', 9), 
(3, 3, 'Espadas', 10), 
(4, 4, 'Espadas', 1), 
(5, 5, 'Espadas', 2), 
(6, 6, 'Espadas', 3), 
(7, 7, 'Espadas', 12), 
(8, 10, 'Espadas', 5), 
(9, 11, 'Espadas', 6), 
(10, 12, 'Espadas', 7), 
(11, 1, 'Bastos', 13), 
(12, 2, 'Bastos', 9), 
(13, 3, 'Bastos', 10), 
(14, 4, 'Bastos', 1), 
(15, 5, 'Bastos', 2), 
(16, 6, 'Bastos', 3), 
(17, 7, 'Bastos', 4), 
(18, 10, 'Bastos', 5), 
(19, 11, 'Bastos', 6), 
(20, 12, 'Bastos', 7), 
(21, 1, 'Oros', 8), 
(22, 2, 'Oros', 9), 
(23, 3, 'Oros', 10), 
(24, 4, 'Oros', 1), 
(25, 5, 'Oros', 2), 
(26, 6, 'Oros', 3), 
(27, 7, 'Oros', 11), 
(28, 10, 'Oros', 5), 
(29, 11, 'Oros', 6), 
(30, 12, 'Oros', 7), 
(31, 1, 'Copas', 8), 
(32, 2, 'Copas', 9), 
(33, 3, 'Copas', 10), 
(34, 4, 'Copas', 1), 
(35, 5, 'Copas', 2), 
(36, 6, 'Copas', 3), 
(37, 7, 'Copas', 4), 
(38, 10, 'Copas', 5), 
(39, 11, 'Copas', 6), 
(40, 12, 'Copas', 7);