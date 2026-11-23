package com.inietojo.gestion_salas.domain;

import java.util.Locale;
import java.util.function.Predicate;

public class ValidadorUsuario {

    private final Predicate<String> emailExistente;

    public ValidadorUsuario(Predicate<String> emailExistente) {
        this.emailExistente = emailExistente;
    }

    public UsuarioAlta validar(UsuarioAlta entrada) {
        if (entrada == null) {
            throw new ValidacionUsuarioException("userName");
        }

        String name = recortar(entrada.name());
        String email = recortar(entrada.email());
        String phone = recortar(entrada.phone());
        String rol = recortar(entrada.rol());
        String dni = recortar(entrada.dni());

        if (name == null || name.isEmpty() || name.length() > 6) {
            throw new ValidacionUsuarioException("userName");
        }

        if (email == null || email.isEmpty()
                || email.indexOf('@') < 0
                || email.indexOf('.') < 0) {
            throw new ValidacionUsuarioException("email");
        }

        if (!"admin".equals(rol) && !"superadmin".equals(rol)) {
            throw new ValidacionUsuarioException("rol");
        }

        if (dni == null || dni.isEmpty()) {
            throw new ValidacionUsuarioException("dni");
        }

        String emailNormalizado = email.toLowerCase(Locale.ROOT);
        if (emailExistente != null && emailExistente.test(emailNormalizado)) {
            throw new ValidacionUsuarioException("email");
        }

        return new UsuarioAlta(
                name.toLowerCase(Locale.ROOT),
                emailNormalizado,
                phone,
                rol,
                dni
        );
    }

    private static String recortar(String valor) {
        return valor == null ? null : valor.trim();
    }
}
