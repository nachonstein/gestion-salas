package com.inietojo.gestion_salas.domain;

import com.inietojo.gestion_salas.integration.DniValidationResult;
import com.inietojo.gestion_salas.integration.DniValidator;
import com.inietojo.gestion_salas.integration.UserNotifier;
import com.inietojo.gestion_salas.persistence.Sala;
import com.inietojo.gestion_salas.persistence.SalaRepository;
import com.inietojo.gestion_salas.persistence.Usuario;
import com.inietojo.gestion_salas.persistence.UsuarioRepository;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

@Service
public class AltaUsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final SalaRepository salaRepository;
    private final DniValidator dniValidator;
    private final UserNotifier userNotifier;

    public AltaUsuarioService(
            UsuarioRepository usuarioRepository,
            SalaRepository salaRepository,
            DniValidator dniValidator,
            UserNotifier userNotifier
    ) {
        this.usuarioRepository = usuarioRepository;
        this.salaRepository = salaRepository;
        this.dniValidator = dniValidator;
        this.userNotifier = userNotifier;
    }

    public Long alta(UsuarioAlta entrada) {
        ValidadorUsuario validador = new ValidadorUsuario(
                usuarioRepository::existsByEmailIgnoreCase
        );
        UsuarioAlta validado = validador.validar(entrada);

        DniValidationResult dniResult = dniValidator.validar(validado.dni());
        if (dniResult == DniValidationResult.REJECTED) {
            throw new ValidacionUsuarioException("dni");
        }
        if (dniResult == DniValidationResult.TECHNICAL_FAILURE) {
            throw new AltaUsuarioException(503, "503", "error de dependencia");
        }

        try {
            Sala sala1 = salaRepository.findById(1L)
                    .orElseThrow(() -> new AltaUsuarioException(
                            503, "503", "error de dependencia"
                    ));
            Usuario usuario = usuarioRepository.saveAndFlush(new Usuario(
                    validado.name(),
                    validado.email(),
                    validado.phone(),
                    validado.rol(),
                    validado.dni(),
                    sala1
            ));

            userNotifier.notificar(
                    usuario.getRol(),
                    usuario.getEmail(),
                    usuario.getPhone()
            );
            return usuario.getId();
        } catch (DataIntegrityViolationException exception) {
            throw new ValidacionUsuarioException("email");
        } catch (DataAccessException exception) {
            throw new AltaUsuarioException(503, "503", "error de dependencia");
        }
    }
}
