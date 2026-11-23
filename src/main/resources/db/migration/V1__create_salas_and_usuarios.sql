CREATE SEQUENCE gestion_salas_sala_seq START WITH 2 INCREMENT BY 1;
CREATE SEQUENCE gestion_salas_usuario_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE gestion_salas_sala (
    id BIGINT NOT NULL PRIMARY KEY
);

CREATE TABLE gestion_salas_usuario (
    id BIGINT NOT NULL PRIMARY KEY,
    name VARCHAR(6) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    dni VARCHAR(255) NOT NULL,
    sala_id BIGINT NOT NULL,
    CONSTRAINT fk_gestion_salas_usuario_sala
        FOREIGN KEY (sala_id) REFERENCES gestion_salas_sala (id)
);

INSERT INTO gestion_salas_sala (id) VALUES (1);
