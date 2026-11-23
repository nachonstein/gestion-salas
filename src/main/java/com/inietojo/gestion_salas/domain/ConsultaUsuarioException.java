package com.inietojo.gestion_salas.domain;

public class ConsultaUsuarioException extends RuntimeException {

    public ConsultaUsuarioException() {
        super("user not found");
    }
}
