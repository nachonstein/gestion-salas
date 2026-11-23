package com.inietojo.gestion_salas.api;

import com.inietojo.gestion_salas.domain.AltaUsuarioException;
import com.inietojo.gestion_salas.domain.ValidacionUsuarioException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ValidacionUsuarioException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(ValidacionUsuarioException exception) {
        return ResponseEntity.status(409).body(Map.of(
                "code", 409,
                "message", exception.getMessage()
        ));
    }

    @ExceptionHandler(AltaUsuarioException.class)
    public ResponseEntity<Map<String, Object>> handleAlta(AltaUsuarioException exception) {
        return ResponseEntity.status(exception.getStatus()).body(Map.of(
                "code", exception.getStatus(),
                "message", exception.getMessage()
        ));
    }
}
