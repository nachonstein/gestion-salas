package com.inietojo.gestion_salas.domain;

public class CreateUserException extends RuntimeException {

    private final int status;
    private final String code;

    public CreateUserException(int status, String code, String message) {
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
