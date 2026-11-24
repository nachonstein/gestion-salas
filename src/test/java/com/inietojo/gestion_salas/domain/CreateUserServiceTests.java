package com.inietojo.gestion_salas.domain;

import com.inietojo.gestion_salas.integration.DniValidationResult;
import com.inietojo.gestion_salas.integration.DniValidator;
import com.inietojo.gestion_salas.integration.NotificationResult;
import com.inietojo.gestion_salas.integration.UserNotifier;
import com.inietojo.gestion_salas.persistence.Room;
import com.inietojo.gestion_salas.persistence.RoomRepository;
import com.inietojo.gestion_salas.persistence.User;
import com.inietojo.gestion_salas.persistence.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CreateUserServiceTests {

    @Test
    void persistsBeforeNotifyingAndReturnsGeneratedId() {
        UserRepository users = mock(UserRepository.class);
        RoomRepository roomRepository = mock(RoomRepository.class);
        DniValidator dni = mock(DniValidator.class);
        UserNotifier notifier = mock(UserNotifier.class);
        Room roomOne = new Room(1L);

        when(users.existsByEmailIgnoreCase(any())).thenReturn(false);
        when(dni.validate("23454234W")).thenReturn(DniValidationResult.APPROVED);
        when(roomRepository.findById(1L)).thenReturn(Optional.of(roomOne));
        when(users.saveAndFlush(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            java.lang.reflect.Field id = User.class.getDeclaredField("id");
            id.setAccessible(true);
            id.set(user, 42L);
            return user;
        });
        when(notifier.notify("admin", "email@example.com", "677998899"))
                .thenReturn(NotificationResult.SENT);

        Long id = new CreateUserService(users, roomRepository, dni, notifier).create(
                new CreateUserInput(" PABLO ", " EMAIL@EXAMPLE.COM ", " 677998899 ", " admin ", " 23454234W ")
        );

        assertEquals(42L, id);
        verify(notifier).notify("admin", "email@example.com", "677998899");
    }

    @Test
    void rejectedDniDoesNotPersistOrNotify() {
        UserRepository users = mock(UserRepository.class);
        RoomRepository roomRepository = mock(RoomRepository.class);
        DniValidator dni = mock(DniValidator.class);
        UserNotifier notifier = mock(UserNotifier.class);

        when(dni.validate("99999999w")).thenReturn(DniValidationResult.REJECTED);

        UserValidationException exception = assertThrows(UserValidationException.class,
                () -> new CreateUserService(users, roomRepository, dni, notifier).create(
                        new CreateUserInput("pablo", "email@example.com", "677998899", "admin", "99999999w")
                ));

        assertEquals("dni", exception.getField());
        verify(users, never()).saveAndFlush(any());
        verify(notifier, never()).notify(any(), any(), any());
    }

    @Test
    void notificationFailureStillReturnsSuccessId() {
        UserRepository users = mock(UserRepository.class);
        RoomRepository roomRepository = mock(RoomRepository.class);
        DniValidator dni = mock(DniValidator.class);
        UserNotifier notifier = mock(UserNotifier.class);

        when(users.existsByEmailIgnoreCase(any())).thenReturn(false);
        when(dni.validate("23454234W")).thenReturn(DniValidationResult.APPROVED);
        when(roomRepository.findById(1L)).thenReturn(Optional.of(new Room(1L)));
        when(users.saveAndFlush(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            java.lang.reflect.Field id = User.class.getDeclaredField("id");
            id.setAccessible(true);
            id.set(user, 7L);
            return user;
        });
        when(notifier.notify(any(), any(), any())).thenReturn(NotificationResult.FAILED);

        Long id = new CreateUserService(users, roomRepository, dni, notifier).create(
                new CreateUserInput("pablo", "email@example.com", "", "superadmin", "23454234W")
        );

        assertEquals(7L, id);
    }
}
