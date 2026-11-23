package com.inietojo.gestion_salas.domain;

import com.inietojo.gestion_salas.integration.DniValidationResult;
import com.inietojo.gestion_salas.integration.DniValidator;
import com.inietojo.gestion_salas.integration.NotificationResult;
import com.inietojo.gestion_salas.integration.UserNotifier;
import com.inietojo.gestion_salas.persistence.Sala;
import com.inietojo.gestion_salas.persistence.SalaRepository;
import com.inietojo.gestion_salas.persistence.Usuario;
import com.inietojo.gestion_salas.persistence.UsuarioRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AltaUsuarioServiceTests {

    @Test
    void persistsBeforeNotifyingAndReturnsGeneratedId() {
        UsuarioRepository usuarios = mock(UsuarioRepository.class);
        SalaRepository salas = mock(SalaRepository.class);
        DniValidator dni = mock(DniValidator.class);
        UserNotifier notifier = mock(UserNotifier.class);
        Sala sala1 = new Sala(1L);

        when(usuarios.existsByEmailIgnoreCase(any())).thenReturn(false);
        when(dni.validar("23454234W")).thenReturn(DniValidationResult.APPROVED);
        when(salas.findById(1L)).thenReturn(Optional.of(sala1));
        when(usuarios.saveAndFlush(any(Usuario.class))).thenAnswer(invocation -> {
            Usuario usuario = invocation.getArgument(0);
            java.lang.reflect.Field id = Usuario.class.getDeclaredField("id");
            id.setAccessible(true);
            id.set(usuario, 42L);
            return usuario;
        });
        when(notifier.notificar("admin", "email@example.com", "677998899"))
                .thenReturn(NotificationResult.SENT);

        Long id = new AltaUsuarioService(usuarios, salas, dni, notifier).alta(
                new UsuarioAlta(" PABLO ", " EMAIL@EXAMPLE.COM ", " 677998899 ", " admin ", " 23454234W ")
        );

        assertEquals(42L, id);
        verify(notifier).notificar("admin", "email@example.com", "677998899");
    }

    @Test
    void rejectedDniDoesNotPersistOrNotify() {
        UsuarioRepository usuarios = mock(UsuarioRepository.class);
        SalaRepository salas = mock(SalaRepository.class);
        DniValidator dni = mock(DniValidator.class);
        UserNotifier notifier = mock(UserNotifier.class);

        when(dni.validar("99999999w")).thenReturn(DniValidationResult.REJECTED);

        ValidacionUsuarioException exception = assertThrows(ValidacionUsuarioException.class,
                () -> new AltaUsuarioService(usuarios, salas, dni, notifier).alta(
                        new UsuarioAlta("pablo", "email@example.com", "677998899", "admin", "99999999w")
                ));

        assertEquals("dni", exception.getCampo());
        verify(usuarios, never()).saveAndFlush(any());
        verify(notifier, never()).notificar(any(), any(), any());
    }

    @Test
    void notificationFailureStillReturnsSuccessId() {
        UsuarioRepository usuarios = mock(UsuarioRepository.class);
        SalaRepository salas = mock(SalaRepository.class);
        DniValidator dni = mock(DniValidator.class);
        UserNotifier notifier = mock(UserNotifier.class);

        when(usuarios.existsByEmailIgnoreCase(any())).thenReturn(false);
        when(dni.validar("23454234W")).thenReturn(DniValidationResult.APPROVED);
        when(salas.findById(1L)).thenReturn(Optional.of(new Sala(1L)));
        when(usuarios.saveAndFlush(any(Usuario.class))).thenAnswer(invocation -> {
            Usuario usuario = invocation.getArgument(0);
            java.lang.reflect.Field id = Usuario.class.getDeclaredField("id");
            id.setAccessible(true);
            id.set(usuario, 7L);
            return usuario;
        });
        when(notifier.notificar(any(), any(), any())).thenReturn(NotificationResult.FAILED);

        Long id = new AltaUsuarioService(usuarios, salas, dni, notifier).alta(
                new UsuarioAlta("pablo", "email@example.com", "", "superadmin", "23454234W")
        );

        assertEquals(7L, id);
    }
}
