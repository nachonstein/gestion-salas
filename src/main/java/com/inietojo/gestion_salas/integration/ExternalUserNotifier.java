package com.inietojo.gestion_salas.integration;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ExternalUserNotifier implements UserNotifier {

    private static final Logger LOGGER = LoggerFactory.getLogger(ExternalUserNotifier.class);

    private final RestClient restClient;

    public ExternalUserNotifier(ExternalApiProperties properties) {
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
    public NotificationResult notificar(String rol, String email, String phone) {
        if ("admin".equals(rol)) {
            return enviar("/email", Map.of(
                    "email", email,
                    "message", "usuario guardado"
            ), "email");
        }

        if ("superadmin".equals(rol)) {
            return enviar("/sms", Map.of(
                    "phone", phone,
                    "message", "usuario guardado"
            ), "sms");
        }

        return NotificationResult.FAILED;
    }

    private NotificationResult enviar(String uri, Map<String, String> body, String channel) {
        try {
            Integer status = restClient.post()
                    .uri(uri)
                    .body(body)
                    .exchange((request, response) -> response.getStatusCode().value());
            if (status != null && status == 200) {
                return NotificationResult.SENT;
            }
            LOGGER.warn("Fallo al enviar la notificacion por el canal {}", channel);
            return NotificationResult.FAILED;
        } catch (RuntimeException exception) {
            LOGGER.warn("Fallo al enviar la notificacion por el canal {}", channel);
            return NotificationResult.FAILED;
        }
    }
}
