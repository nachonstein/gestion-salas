package com.inietojo.gestion_salas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class GestionSalasApplication {

    public static void main(String[] args) {
        SpringApplication.run(GestionSalasApplication.class, args);
    }

}
