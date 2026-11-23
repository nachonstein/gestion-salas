package com.inietojo.gestion_salas.integration;

public interface UserNotifier {
    NotificationResult notificar(String rol, String email, String phone);
}
