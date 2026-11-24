package com.inietojo.gestion_salas.persistence;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserRepositoryTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomOneProvisioner roomOneProvisioner;

    @Test
    void shouldProvisionRoom1Idempotently() {
        roomRepository.deleteById(1L);
        roomRepository.flush();

        roomOneProvisioner.ensureRoomOne();
        roomOneProvisioner.ensureRoomOne();

        assertTrue(roomRepository.findById(1L).isPresent());
        assertEquals(1L, roomRepository.count());
    }

    @Test
    void shouldGenerateIncrementalRoomIds() {
        Room secondRoom = roomRepository.saveAndFlush(new Room(null));
        Room thirdRoom = roomRepository.saveAndFlush(new Room(null));

        assertTrue(secondRoom.getId() > 1L);
        assertEquals(secondRoom.getId() + 1L, thirdRoom.getId());
    }

    @Test
    void shouldPersistUserWithGeneratedIdAndRoomRelation() {
        Room roomOne = roomRepository.findById(1L).orElseThrow();
        User user = userRepository.saveAndFlush(
                new User("pablo", "EMAIL@EXAMPLE.COM", "677998899", "admin", "23454234W", roomOne)
        );

        assertNotNull(user.getId());
        assertTrue(user.getId() > 0);
        assertEquals("email@example.com", user.getEmail());
        assertEquals(1L, user.getRoom().getId());
        assertTrue(userRepository.findByIdAndRoom_Id(user.getId(), 1L).isPresent());
        assertFalse(userRepository.findByIdAndRoom_Id(user.getId(), 2L).isPresent());
    }

    @Test
    void shouldNotFindUserOutsideRoom1() {
        Room roomOne = roomRepository.findById(1L).orElseThrow();
        Room otherRoom = roomRepository.saveAndFlush(new Room(null));
        User user = userRepository.saveAndFlush(
                new User("maria", "maria@example.com", "600000000", "superadmin", "11111111A", otherRoom)
        );

        assertTrue(userRepository.findByIdAndRoom_Id(user.getId(), 1L).isEmpty());
        assertTrue(userRepository.findByIdAndRoom_Id(user.getId(), otherRoom.getId()).isPresent());
        assertEquals(1L, roomOne.getId());
    }

    @Test
    void shouldEnforceCaseInsensitiveEmailUniquenessInDatabase() {
        Room roomOne = roomRepository.findById(1L).orElseThrow();
        userRepository.saveAndFlush(
                new User("pablo", "email@example.com", "677998899", "admin", "23454234W", roomOne)
        );

        assertTrue(userRepository.existsByEmailIgnoreCase("EMAIL@EXAMPLE.COM"));
        assertThrows(DataIntegrityViolationException.class, () ->
                userRepository.saveAndFlush(
                        new User("maria", "EMAIL@EXAMPLE.COM", "600000000", "admin", "11111111A", roomOne)
                )
        );
    }
}
