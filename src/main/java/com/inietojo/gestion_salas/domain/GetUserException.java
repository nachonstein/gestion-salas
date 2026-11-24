package com.inietojo.gestion_salas.domain;

public class GetUserException extends RuntimeException {

    public GetUserException() {
        super("user not found");
    }
}
