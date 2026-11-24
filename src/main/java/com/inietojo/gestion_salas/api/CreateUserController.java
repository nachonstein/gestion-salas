package com.inietojo.gestion_salas.api;

import com.inietojo.gestion_salas.domain.CreateUserService;
import com.inietojo.gestion_salas.domain.CreateUserInput;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/usuarios")
public class CreateUserController {

    private final CreateUserService createUserService;

    public CreateUserController(CreateUserService createUserService) {
        this.createUserService = createUserService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Long>> create(@RequestBody CreateUserInput input) {
        Long id = createUserService.create(input);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id));
    }
}
