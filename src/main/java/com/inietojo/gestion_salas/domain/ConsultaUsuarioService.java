package com.inietojo.gestion_salas.domain;

import com.inietojo.gestion_salas.persistence.Usuario;
import com.inietojo.gestion_salas.persistence.UsuarioRepository;
import org.springframework.stereotype.Service;

@Service
public class ConsultaUsuarioService {

    private final UsuarioRepository usuarioRepository;

    public ConsultaUsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public UsuarioConsulta consultar(Long id) {
        Usuario usuario = usuarioRepository.findByIdAndSala_Id(id, 1L)
                .orElseThrow(() -> new ConsultaUsuarioException());
        return new UsuarioConsulta(
                usuario.getId(),
                usuario.getName(),
                usuario.getEmail(),
                usuario.getPhone(),
                usuario.getRol(),
                usuario.getDni()
        );
    }
}
