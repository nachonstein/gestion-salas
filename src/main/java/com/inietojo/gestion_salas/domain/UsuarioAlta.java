package com.inietojo.gestion_salas.domain;

public record UsuarioAlta(
        String name,
        String email,
        String phone,
        String rol,
        String dni
) {
}
