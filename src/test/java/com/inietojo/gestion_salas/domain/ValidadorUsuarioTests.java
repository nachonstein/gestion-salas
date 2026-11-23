package com.inietojo.gestion_salas.domain;

import org.junit.jupiter.api.Test;

import java.util.Locale;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ValidadorUsuarioTests {

    @Test
    void shouldAcceptAndNormalizeValidInput() {
        ValidadorUsuario validador = new ValidadorUsuario(email -> false);

        UsuarioAlta resultado = validador.validar(new UsuarioAlta(
                "  PABLO  ",
                "  EMAIL@EXAMPLE.COM ",
                " 677998899 ",
                "admin",
                " 23454234W "
        ));

        assertEquals("pablo", resultado.name());
        assertEquals("email@example.com", resultado.email());
        assertEquals("677998899", resultado.phone());
        assertEquals("admin", resultado.rol());
        assertEquals("23454234W", resultado.dni());
    }

    @Test
    void shouldAcceptSixCharacterNameAndRejectSeven() {
        ValidadorUsuario validador = new ValidadorUsuario(email -> false);

        assertEquals(
                "123456",
                validador.validar(valid("123456", "email@example.com", "admin")).name()
        );

        assertValidationField(
                "userName",
                () -> validador.validar(valid("1234567", "email@example.com", "admin"))
        );
    }

    @Test
    void shouldRejectEmptyName() {
        assertValidationField(
                "userName",
                () -> new ValidadorUsuario(email -> false)
                        .validar(valid("   ", "email@example.com", "admin"))
        );
    }

    @Test
    void shouldApplyMinimalEmailRule() {
        ValidadorUsuario validador = new ValidadorUsuario(email -> false);

        assertValidationField(
                "email",
                () -> validador.validar(valid("pablo", "emailexample.com", "admin"))
        );
        assertValidationField(
                "email",
                () -> validador.validar(valid("pablo", "email@examplecom", "admin"))
        );
        assertValidationField(
                "email",
                () -> validador.validar(valid("pablo", "   ", "admin"))
        );
    }

    @Test
    void shouldRejectCaseInsensitiveDuplicateEmail() {
        ValidadorUsuario validador = new ValidadorUsuario(email ->
                email.toLowerCase(Locale.ROOT).equals("email@example.com"));

        assertValidationField(
                "email",
                () -> validador.validar(valid("pablo", "EMAIL@EXAMPLE.COM", "admin"))
        );
    }

    @Test
    void shouldAcceptOnlyApprovedRoles() {
        ValidadorUsuario validador = new ValidadorUsuario(email -> false);

        validador.validar(valid("pablo", "email@example.com", "admin"));
        validador.validar(valid("pablo", "email@example.com", "superadmin"));

        assertValidationField(
                "rol",
                () -> validador.validar(valid("pablo", "email@example.com", "ADMIN"))
        );
        assertValidationField(
                "rol",
                () -> validador.validar(valid("pablo", "email@example.com", "usuario"))
        );
    }

    @Test
    void shouldNotValidatePhoneAndShouldRequireDni() {
        ValidadorUsuario validador = new ValidadorUsuario(email -> false);
        UsuarioAlta entradaSinTelefono = new UsuarioAlta(
                "pablo", "email@example.com", "", "admin", "23454234W"
        );

        assertEquals("", validador.validar(entradaSinTelefono).phone());

        assertValidationField(
                "dni",
                () -> validador.validar(new UsuarioAlta(
                        "pablo", "email@example.com", "", "admin", " "
                ))
        );
    }

    private static UsuarioAlta valid(String name, String email, String rol) {
        return new UsuarioAlta(name, email, "677998899", rol, "23454234W");
    }

    private static void assertValidationField(String campo, org.junit.jupiter.api.function.Executable executable) {
        ValidacionUsuarioException exception =
                assertThrows(ValidacionUsuarioException.class, executable);
        assertEquals(campo, exception.getCampo());
        assertEquals("error validation " + campo, exception.getMessage());
    }
}
