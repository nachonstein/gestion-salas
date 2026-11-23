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
class UsuarioRepositoryTests {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private SalaRepository salaRepository;

    @Autowired
    private Sala1Provisioner sala1Provisioner;

    @Test
    void shouldProvisionSala1Idempotently() {
        salaRepository.deleteById(1L);
        salaRepository.flush();

        sala1Provisioner.ensureSala1();
        sala1Provisioner.ensureSala1();

        assertTrue(salaRepository.findById(1L).isPresent());
        assertEquals(1L, salaRepository.count());
    }

    @Test
    void shouldGenerateIncrementalSalaIds() {
        Sala secondSala = salaRepository.saveAndFlush(new Sala(null));
        Sala thirdSala = salaRepository.saveAndFlush(new Sala(null));

        assertTrue(secondSala.getId() > 1L);
        assertEquals(secondSala.getId() + 1L, thirdSala.getId());
    }

    @Test
    void shouldPersistUsuarioWithGeneratedIdAndSalaRelation() {
        Sala sala1 = salaRepository.findById(1L).orElseThrow();
        Usuario usuario = usuarioRepository.saveAndFlush(
                new Usuario("pablo", "EMAIL@EXAMPLE.COM", "677998899", "admin", "23454234W", sala1)
        );

        assertNotNull(usuario.getId());
        assertTrue(usuario.getId() > 0);
        assertEquals("email@example.com", usuario.getEmail());
        assertEquals(1L, usuario.getSala().getId());
        assertTrue(usuarioRepository.findByIdAndSala_Id(usuario.getId(), 1L).isPresent());
        assertFalse(usuarioRepository.findByIdAndSala_Id(usuario.getId(), 2L).isPresent());
    }

    @Test
    void shouldEnforceCaseInsensitiveEmailUniquenessInDatabase() {
        Sala sala1 = salaRepository.findById(1L).orElseThrow();
        usuarioRepository.saveAndFlush(
                new Usuario("pablo", "email@example.com", "677998899", "admin", "23454234W", sala1)
        );

        assertTrue(usuarioRepository.existsByEmailIgnoreCase("EMAIL@EXAMPLE.COM"));
        assertThrows(DataIntegrityViolationException.class, () ->
                usuarioRepository.saveAndFlush(
                        new Usuario("maria", "EMAIL@EXAMPLE.COM", "600000000", "admin", "11111111A", sala1)
                )
        );
    }
}
