package com.inietojo.gestion_salas.api;

import com.inietojo.gestion_salas.domain.ConsultaUsuarioService;
import com.inietojo.gestion_salas.domain.UsuarioConsulta;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ConsultaUsuarioControllerTests {

    @Test
    void returns200WithUsuarioConsulta() {
        ConsultaUsuarioService service = mock(ConsultaUsuarioService.class);
        UsuarioConsulta consulta = new UsuarioConsulta(
                42L, "pablo", "email@example.com", "677998899", "admin", "23454234W"
        );
        when(service.consultar(42L)).thenReturn(consulta);

        ResponseEntity<UsuarioConsulta> response =
                new ConsultaUsuarioController(service).consultar(42L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(consulta, response.getBody());
    }

    @Test
    void exceptionHandlerReturnsNotFoundContract() {
        com.inietojo.gestion_salas.domain.ConsultaUsuarioException exception =
                new com.inietojo.gestion_salas.domain.ConsultaUsuarioException();
        ResponseEntity<Map<String, Object>> response =
                new ApiExceptionHandler().handleConsulta(exception);

        assertEquals(404, response.getStatusCode().value());
        assertEquals(404, response.getBody().get("code"));
        assertEquals("user not found", response.getBody().get("message"));
    }
}
