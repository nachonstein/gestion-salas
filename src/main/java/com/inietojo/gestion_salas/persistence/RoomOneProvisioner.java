package com.inietojo.gestion_salas.persistence;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RoomOneProvisioner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public RoomOneProvisioner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        ensureRoomOne();
    }

    @Transactional
    public void ensureRoomOne() {
        jdbcTemplate.update(
                "INSERT INTO gestion_salas_sala (id) "
                        + "SELECT 1 WHERE NOT EXISTS "
                        + "(SELECT 1 FROM gestion_salas_sala WHERE id = 1)"
        );
    }
}
