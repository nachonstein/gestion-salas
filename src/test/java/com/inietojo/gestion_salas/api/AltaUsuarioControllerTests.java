package com.inietojo.gestion_salas.api;

import com.inietojo.gestion_salas.domain.AltaUsuarioService;
import com.inietojo.gestion_salas.domain.ValidacionUsuarioException;
import com.inietojo.gestion_salas.domain.UsuarioAlta;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AltaUsuarioControllerTests {

    @Test
    void returns201WithGeneratedId() {
        AltaUsuarioService service = mock(AltaUsuarioService.class);
        when(service.alta(any(UsuarioAlta.class))).thenReturn(42L);

        ResponseEntity<Map<String, Long>> response =
                new AltaUsuarioController(service).alta(
                        new UsuarioAlta("pablo", "email@example.com", "677998899", "admin", "23454234W")
                );

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(42L, response.getBody().get("id"));
    }

    @Test
    void exceptionHandlerReturnsValidationContract() {
        ValidacionUsuarioException exception = new ValidacionUsuarioException("email");
        ResponseEntity<Map<String, Object>> response =
                new ApiExceptionHandler().handleValidation(exception);

        assertEquals(409, response.getStatusCode().value());
        assertEquals(409, response.getBody().get("code"));
        assertEquals("error validation email", response.getBody().get("message"));
    }
}
