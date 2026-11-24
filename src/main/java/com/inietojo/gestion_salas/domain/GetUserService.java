package com.inietojo.gestion_salas.domain;

import com.inietojo.gestion_salas.persistence.User;
import com.inietojo.gestion_salas.persistence.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class GetUserService {

    private final UserRepository userRepository;

    public GetUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponse find(Long id) {
        User user = userRepository.findByIdAndRoom_Id(id, 1L)
                .orElseThrow(() -> new GetUserException());
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRol(),
                user.getDni()
        );
    }
}
