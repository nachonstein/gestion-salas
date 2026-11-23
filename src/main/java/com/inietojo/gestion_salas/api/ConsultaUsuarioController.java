package com.inietojo.gestion_salas.api;

import com.inietojo.gestion_salas.domain.ConsultaUsuarioService;
import com.inietojo.gestion_salas.domain.UsuarioConsulta;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/usuarios")
public class ConsultaUsuarioController {

    private final ConsultaUsuarioService consultaUsuarioService;

    public ConsultaUsuarioController(ConsultaUsuarioService consultaUsuarioService) {
        this.consultaUsuarioService = consultaUsuarioService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioConsulta> consultar(@PathVariable Long id) {
        return ResponseEntity.ok(consultaUsuarioService.consultar(id));
    }
}
