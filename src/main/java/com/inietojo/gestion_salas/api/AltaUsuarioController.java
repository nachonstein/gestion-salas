package com.inietojo.gestion_salas.api;

import com.inietojo.gestion_salas.domain.AltaUsuarioService;
import com.inietojo.gestion_salas.domain.UsuarioAlta;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/usuarios")
public class AltaUsuarioController {

    private final AltaUsuarioService altaUsuarioService;

    public AltaUsuarioController(AltaUsuarioService altaUsuarioService) {
        this.altaUsuarioService = altaUsuarioService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Long>> alta(@RequestBody UsuarioAlta entrada) {
        Long id = altaUsuarioService.alta(entrada);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id));
    }
}
