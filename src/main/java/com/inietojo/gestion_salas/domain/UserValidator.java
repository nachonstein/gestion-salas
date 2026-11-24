package com.inietojo.gestion_salas.domain;

import java.util.Locale;
import java.util.function.Predicate;

public class UserValidator {

    private final Predicate<String> existingEmail;

    public UserValidator(Predicate<String> existingEmail) {
        this.existingEmail = existingEmail;
    }

    public CreateUserInput validate(CreateUserInput input) {
        if (input == null) {
            throw new UserValidationException("userName");
        }

        String name = trim(input.name());
        String email = trim(input.email());
        String phone = trim(input.phone());
        String rol = trim(input.rol());
        String dni = trim(input.dni());

        if (name == null || name.isEmpty() || name.length() > 6) {
            throw new UserValidationException("userName");
        }

        if (email == null || email.isEmpty()
                || email.indexOf('@') < 0
                || email.indexOf('.') < 0) {
            throw new UserValidationException("email");
        }

        if (!"admin".equals(rol) && !"superadmin".equals(rol)) {
            throw new UserValidationException("rol");
        }

        if (dni == null || dni.isEmpty()) {
            throw new UserValidationException("dni");
        }

        String normalizedEmail = email.toLowerCase(Locale.ROOT);
        if (existingEmail != null && existingEmail.test(normalizedEmail)) {
            throw new UserValidationException("email");
        }

        return new CreateUserInput(
                name.toLowerCase(Locale.ROOT),
                normalizedEmail,
                phone,
                rol,
                dni
        );
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }
}
