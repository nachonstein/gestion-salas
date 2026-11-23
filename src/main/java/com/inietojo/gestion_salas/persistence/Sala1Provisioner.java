package com.inietojo.gestion_salas.persistence;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class Sala1Provisioner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public Sala1Provisioner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        ensureSala1();
    }

    @Transactional
    public void ensureSala1() {
        jdbcTemplate.update(
                "INSERT INTO gestion_salas_sala (id) "
                        + "SELECT 1 WHERE NOT EXISTS "
                        + "(SELECT 1 FROM gestion_salas_sala WHERE id = 1)"
        );
    }
}
