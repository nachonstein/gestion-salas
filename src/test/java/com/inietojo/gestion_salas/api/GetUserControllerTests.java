package com.inietojo.gestion_salas.api;

import com.inietojo.gestion_salas.domain.GetUserService;
import com.inietojo.gestion_salas.domain.UserResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GetUserControllerTests {

    @Test
    void returns200WithUserResponse() {
        GetUserService service = mock(GetUserService.class);
        UserResponse userResponse = new UserResponse(
                42L, "pablo", "email@example.com", "677998899", "admin", "23454234W"
        );
        when(service.find(42L)).thenReturn(userResponse);

        ResponseEntity<UserResponse> response =
                new GetUserController(service).find(42L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(userResponse, response.getBody());
    }

    @Test
    void exceptionHandlerReturnsNotFoundContract() {
        com.inietojo.gestion_salas.domain.GetUserException exception =
                new com.inietojo.gestion_salas.domain.GetUserException();
        ResponseEntity<Map<String, Object>> response =
                new ApiExceptionHandler().handleGet(exception);

        assertEquals(404, response.getStatusCode().value());
        assertEquals(404, response.getBody().get("code"));
        assertEquals("user not found", response.getBody().get("message"));
    }
}
