package com.inietojo.gestion_salas.integration;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicReference;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ExternalApiIntegrationTests {

    @Test
    void mapsDniApprovedRejectedAndTechnicalFailure() throws Exception {
        AtomicReference<String> body = new AtomicReference<>();
        HttpServer server = startServer(exchange -> {
            body.set(readBody(exchange));
            String dni = body.get().contains("99999999w") ? "reject" : "approve";
            exchange.sendResponseHeaders("reject".equals(dni) ? 409 : 200, -1);
            exchange.close();
        });

        try {
            ExternalDniValidator validator = validator(server);

            assertEquals(DniValidationResult.APPROVED, validator.validar("23454234W"));
            assertEquals(DniValidationResult.REJECTED, validator.validar("99999999w"));
            assertEquals(DniValidationResult.APPROVED, validator.validar("23454234W"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    void returnsTechnicalFailureWhenDniApiIsUnavailable() throws Exception {
        ExternalDniValidator validator = new ExternalDniValidator(
                new ExternalApiProperties("http://127.0.0.1:1", Duration.ofMillis(100))
        );

        assertEquals(DniValidationResult.TECHNICAL_FAILURE, validator.validar("23454234W"));
    }

    @Test
    void sendsEmailOnlyForAdmin() throws Exception {
        AtomicReference<String> path = new AtomicReference<>();
        AtomicReference<String> body = new AtomicReference<>();
        HttpServer server = startServer(exchange -> {
            path.set(exchange.getRequestURI().getPath());
            body.set(readBody(exchange));
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
        });

        try {
            ExternalUserNotifier notifier = notifier(server);

            assertEquals(NotificationResult.SENT,
                    notifier.notificar("admin", "email@example.com", "677998899"));
            assertEquals("/email", path.get());
            assertEquals(true, body.get().contains("\"email\":\"email@example.com\""));
            assertEquals(true, body.get().contains("\"message\":\"usuario guardado\""));
        } finally {
            server.stop(0);
        }
    }

    @Test
    void sendsSmsOnlyForSuperadmin() throws Exception {
        AtomicReference<String> path = new AtomicReference<>();
        AtomicReference<String> body = new AtomicReference<>();
        HttpServer server = startServer(exchange -> {
            path.set(exchange.getRequestURI().getPath());
            body.set(readBody(exchange));
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
        });

        try {
            ExternalUserNotifier notifier = notifier(server);

            assertEquals(NotificationResult.SENT,
                    notifier.notificar("superadmin", "email@example.com", "677998899"));
            assertEquals("/sms", path.get());
            assertEquals(true, body.get().contains("\"phone\":\"677998899\""));
            assertEquals(true, body.get().contains("\"message\":\"usuario guardado\""));
        } finally {
            server.stop(0);
        }
    }

    @Test
    void notificationFailureDoesNotBecomeSuccess() throws Exception {
        HttpServer server = startServer(exchange -> {
            exchange.sendResponseHeaders(503, -1);
            exchange.close();
        });

        try {
            assertEquals(NotificationResult.FAILED,
                    notifier(server).notificar("admin", "email@example.com", "677998899"));
        } finally {
            server.stop(0);
        }
    }

    private static ExternalDniValidator validator(HttpServer server) {
        return new ExternalDniValidator(apiProperties(server));
    }

    private static ExternalUserNotifier notifier(HttpServer server) {
        return new ExternalUserNotifier(apiProperties(server));
    }

    private static ExternalApiProperties apiProperties(HttpServer server) {
        return new ExternalApiProperties(
                "http://127.0.0.1:" + server.getAddress().getPort(),
                Duration.ofSeconds(1)
        );
    }

    private static HttpServer startServer(HttpHandler handler) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            try {
                handler.handle(exchange);
            } finally {
                exchange.close();
            }
        });
        server.start();
        return server;
    }

    private static String readBody(HttpExchange exchange) throws IOException {
        return new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
    }

    private interface HttpHandler {
        void handle(HttpExchange exchange) throws IOException;
    }
}
