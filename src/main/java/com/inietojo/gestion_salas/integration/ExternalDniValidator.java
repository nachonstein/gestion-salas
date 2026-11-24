package com.inietojo.gestion_salas.integration;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Map;

import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ExternalDniValidator implements DniValidator {

    private final RestClient restClient;

    public ExternalDniValidator(ExternalApiProperties properties) {
        Duration timeout = properties.timeout() == null ? Duration.ofSeconds(5) : properties.timeout();
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(timeout)
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(timeout);

        this.restClient = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public DniValidationResult validate(String dni) {
        try {
            Integer status = restClient.patch()
                    .uri("/check-dni")
                    .body(Map.of("dni", dni))
                    .exchange((request, response) -> response.getStatusCode().value());

            if (status == null) {
                return DniValidationResult.TECHNICAL_FAILURE;
            }
            if (status == 200) {
                return DniValidationResult.APPROVED;
            }
            if (status == 409) {
                return DniValidationResult.REJECTED;
            }
            return DniValidationResult.TECHNICAL_FAILURE;
        } catch (RuntimeException exception) {
            return DniValidationResult.TECHNICAL_FAILURE;
        }
    }
}
