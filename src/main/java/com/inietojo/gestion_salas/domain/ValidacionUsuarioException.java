package com.inietojo.gestion_salas.domain;

public class ValidacionUsuarioException extends RuntimeException {

    private final String campo;

    public ValidacionUsuarioException(String campo) {
        super("error validation " + campo);
        this.campo = campo;
    }

    public String getCampo() {
        return campo;
    }
}
