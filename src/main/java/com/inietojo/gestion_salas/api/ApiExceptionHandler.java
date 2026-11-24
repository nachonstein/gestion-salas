package com.inietojo.gestion_salas.api;

import com.inietojo.gestion_salas.domain.CreateUserException;
import com.inietojo.gestion_salas.domain.GetUserException;
import com.inietojo.gestion_salas.domain.UserValidationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(UserValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(UserValidationException exception) {
        return ResponseEntity.status(409).body(Map.of(
                "code", 409,
                "message", exception.getMessage()
        ));
    }

    @ExceptionHandler(CreateUserException.class)
    public ResponseEntity<Map<String, Object>> handleCreate(CreateUserException exception) {
        return ResponseEntity.status(exception.getStatus()).body(Map.of(
                "code", exception.getStatus(),
                "message", exception.getMessage()
        ));
    }

    @ExceptionHandler(GetUserException.class)
    public ResponseEntity<Map<String, Object>> handleGet(GetUserException exception) {
        return ResponseEntity.status(404).body(Map.of(
                "code", 404,
                "message", exception.getMessage()
        ));
    }
}
