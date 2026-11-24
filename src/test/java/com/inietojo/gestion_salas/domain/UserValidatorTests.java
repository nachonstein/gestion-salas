package com.inietojo.gestion_salas.domain;

import org.junit.jupiter.api.Test;

import java.util.Locale;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class UserValidatorTests {

    @Test
    void shouldAcceptAndNormalizeValidInput() {
        UserValidator validator = new UserValidator(email -> false);

        CreateUserInput result = validator.validate(new CreateUserInput(
                "  PABLO  ",
                "  EMAIL@EXAMPLE.COM ",
                " 677998899 ",
                "admin",
                " 23454234W "
        ));

        assertEquals("pablo", result.name());
        assertEquals("email@example.com", result.email());
        assertEquals("677998899", result.phone());
        assertEquals("admin", result.rol());
        assertEquals("23454234W", result.dni());
    }

    @Test
    void shouldAcceptSixCharacterNameAndRejectSeven() {
        UserValidator validator = new UserValidator(email -> false);

        assertEquals(
                "123456",
                validator.validate(valid("123456", "email@example.com", "admin")).name()
        );

        assertValidationField(
                "userName",
                () -> validator.validate(valid("1234567", "email@example.com", "admin"))
        );
    }

    @Test
    void shouldRejectEmptyName() {
        assertValidationField(
                "userName",
                () -> new UserValidator(email -> false)
                        .validate(valid("   ", "email@example.com", "admin"))
        );
    }

    @Test
    void shouldApplyMinimalEmailRule() {
        UserValidator validator = new UserValidator(email -> false);

        assertValidationField(
                "email",
                () -> validator.validate(valid("pablo", "emailexample.com", "admin"))
        );
        assertValidationField(
                "email",
                () -> validator.validate(valid("pablo", "email@examplecom", "admin"))
        );
        assertValidationField(
                "email",
                () -> validator.validate(valid("pablo", "   ", "admin"))
        );
    }

    @Test
    void shouldRejectCaseInsensitiveDuplicateEmail() {
        UserValidator validator = new UserValidator(email ->
                email.toLowerCase(Locale.ROOT).equals("email@example.com"));

        assertValidationField(
                "email",
                () -> validator.validate(valid("pablo", "EMAIL@EXAMPLE.COM", "admin"))
        );
    }

    @Test
    void shouldAcceptOnlyApprovedRoles() {
        UserValidator validator = new UserValidator(email -> false);

        validator.validate(valid("pablo", "email@example.com", "admin"));
        validator.validate(valid("pablo", "email@example.com", "superadmin"));

        assertValidationField(
                "rol",
                () -> validator.validate(valid("pablo", "email@example.com", "ADMIN"))
        );
        assertValidationField(
                "rol",
                () -> validator.validate(valid("pablo", "email@example.com", "usuario"))
        );
    }

    @Test
    void shouldNotValidatePhoneAndShouldRequireDni() {
        UserValidator validator = new UserValidator(email -> false);
        CreateUserInput inputWithoutPhone = new CreateUserInput(
                "pablo", "email@example.com", "", "admin", "23454234W"
        );

        assertEquals("", validator.validate(inputWithoutPhone).phone());

        assertValidationField(
                "dni",
                () -> validator.validate(new CreateUserInput(
                        "pablo", "email@example.com", "", "admin", " "
                ))
        );
    }

    private static CreateUserInput valid(String name, String email, String rol) {
        return new CreateUserInput(name, email, "677998899", rol, "23454234W");
    }

    private static void assertValidationField(String field, org.junit.jupiter.api.function.Executable executable) {
        UserValidationException exception =
                assertThrows(UserValidationException.class, executable);
        assertEquals(field, exception.getField());
        assertEquals("error validation " + field, exception.getMessage());
    }
}
