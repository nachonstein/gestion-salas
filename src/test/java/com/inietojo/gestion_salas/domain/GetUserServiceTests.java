package com.inietojo.gestion_salas.domain;

import com.inietojo.gestion_salas.persistence.Room;
import com.inietojo.gestion_salas.persistence.User;
import com.inietojo.gestion_salas.persistence.UserRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GetUserServiceTests {

    @Test
    void returnsUserResponseForUserInRoom1() throws Exception {
        UserRepository repository = mock(UserRepository.class);
        User user = new User(
                "pablo", "email@example.com", "677998899", "admin", "23454234W", new Room(1L)
        );
        Field id = User.class.getDeclaredField("id");
        id.setAccessible(true);
        id.set(user, 42L);
        when(repository.findByIdAndRoom_Id(42L, 1L)).thenReturn(Optional.of(user));

        UserResponse result = new GetUserService(repository).find(42L);

        assertEquals(42L, result.id());
        assertEquals("pablo", result.name());
        assertEquals("email@example.com", result.email());
        assertEquals("677998899", result.phone());
        assertEquals("admin", result.rol());
        assertEquals("23454234W", result.dni());
    }

    @Test
    void throwsNotFoundForMissingOrDifferentRoomUser() {
        UserRepository repository = mock(UserRepository.class);
        when(repository.findByIdAndRoom_Id(99L, 1L)).thenReturn(Optional.empty());

        GetUserException exception = assertThrows(
                GetUserException.class,
                () -> new GetUserService(repository).find(99L)
        );

        assertEquals("user not found", exception.getMessage());
    }
}
