package com.inietojo.gestion_salas.domain;

public class UserValidationException extends RuntimeException {

    private final String field;

    public UserValidationException(String field) {
        super("error validation " + field);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
