package com.inietojo.gestion_salas.domain;

import com.inietojo.gestion_salas.integration.DniValidationResult;
import com.inietojo.gestion_salas.integration.DniValidator;
import com.inietojo.gestion_salas.integration.UserNotifier;
import com.inietojo.gestion_salas.persistence.Room;
import com.inietojo.gestion_salas.persistence.RoomRepository;
import com.inietojo.gestion_salas.persistence.User;
import com.inietojo.gestion_salas.persistence.UserRepository;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

@Service
public class CreateUserService {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final DniValidator dniValidator;
    private final UserNotifier userNotifier;

    public CreateUserService(
            UserRepository userRepository,
            RoomRepository roomRepository,
            DniValidator dniValidator,
            UserNotifier userNotifier
    ) {
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.dniValidator = dniValidator;
        this.userNotifier = userNotifier;
    }

    public Long create(CreateUserInput input) {
        UserValidator validator = new UserValidator(
                userRepository::existsByEmailIgnoreCase
        );
        CreateUserInput validated = validator.validate(input);

        DniValidationResult dniResult = dniValidator.validate(validated.dni());
        if (dniResult == DniValidationResult.REJECTED) {
            throw new UserValidationException("dni");
        }
        if (dniResult == DniValidationResult.TECHNICAL_FAILURE) {
            throw new CreateUserException(503, "503", "error de dependencia");
        }

        try {
            Room roomOne = roomRepository.findById(1L)
                    .orElseThrow(() -> new CreateUserException(
                            503, "503", "error de dependencia"
                    ));
            User user = userRepository.saveAndFlush(new User(
                    validated.name(),
                    validated.email(),
                    validated.phone(),
                    validated.rol(),
                    validated.dni(),
                    roomOne
            ));

            userNotifier.notify(
                    user.getRol(),
                    user.getEmail(),
                    user.getPhone()
            );
            return user.getId();
        } catch (DataIntegrityViolationException exception) {
            throw new UserValidationException("email");
        } catch (DataAccessException exception) {
            throw new CreateUserException(503, "503", "error de dependencia");
        }
    }
}
