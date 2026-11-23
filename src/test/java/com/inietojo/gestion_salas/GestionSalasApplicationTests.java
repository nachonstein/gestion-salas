package com.inietojo.gestion_salas;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class GestionSalasApplicationTests {

    @Autowired
    private Environment environment;

    @Test
    void contextLoads() {
        org.junit.jupiter.api.Assertions.assertEquals(
                "jdbc:h2:mem:gestion-salas-test;DB_CLOSE_DELAY=-1",
                environment.getProperty("spring.datasource.url")
        );
        org.junit.jupiter.api.Assertions.assertEquals(
                "http://127.0.0.1:1081",
                environment.getProperty("external.api.base-url")
        );
    }
}
