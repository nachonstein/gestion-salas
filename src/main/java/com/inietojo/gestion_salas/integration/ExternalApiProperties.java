package com.inietojo.gestion_salas.integration;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("external.api")
public record ExternalApiProperties(
        String baseUrl,
        Duration timeout
) {
}
