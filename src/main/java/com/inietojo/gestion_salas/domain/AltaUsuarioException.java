package com.inietojo.gestion_salas.domain;

public class AltaUsuarioException extends RuntimeException {

    private final int status;
    private final String code;

    public AltaUsuarioException(int status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public int getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
