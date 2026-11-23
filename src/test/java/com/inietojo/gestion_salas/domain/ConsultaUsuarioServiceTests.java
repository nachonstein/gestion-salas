package com.inietojo.gestion_salas.domain;

import com.inietojo.gestion_salas.persistence.Sala;
import com.inietojo.gestion_salas.persistence.Usuario;
import com.inietojo.gestion_salas.persistence.UsuarioRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ConsultaUsuarioServiceTests {

    @Test
    void returnsUsuarioConsultaForUserInSala1() throws Exception {
        UsuarioRepository repository = mock(UsuarioRepository.class);
        Usuario usuario = new Usuario(
                "pablo", "email@example.com", "677998899", "admin", "23454234W", new Sala(1L)
        );
        Field id = Usuario.class.getDeclaredField("id");
        id.setAccessible(true);
        id.set(usuario, 42L);
        when(repository.findByIdAndSala_Id(42L, 1L)).thenReturn(Optional.of(usuario));

        UsuarioConsulta result = new ConsultaUsuarioService(repository).consultar(42L);

        assertEquals(42L, result.id());
        assertEquals("pablo", result.name());
        assertEquals("email@example.com", result.email());
        assertEquals("677998899", result.phone());
        assertEquals("admin", result.rol());
        assertEquals("23454234W", result.dni());
    }

    @Test
    void throwsNotFoundForMissingOrDifferentSalaUser() {
        UsuarioRepository repository = mock(UsuarioRepository.class);
        when(repository.findByIdAndSala_Id(99L, 1L)).thenReturn(Optional.empty());

        ConsultaUsuarioException exception = assertThrows(
                ConsultaUsuarioException.class,
                () -> new ConsultaUsuarioService(repository).consultar(99L)
        );

        assertEquals("user not found", exception.getMessage());
    }
}
