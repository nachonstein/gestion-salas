package com.inietojo.gestion_salas.domain;

public record UsuarioConsulta(
        Long id,
        String name,
        String email,
        String phone,
        String rol,
        String dni
) {
}
