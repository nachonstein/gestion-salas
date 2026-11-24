package com.inietojo.gestion_salas.api;

import com.inietojo.gestion_salas.domain.CreateUserService;
import com.inietojo.gestion_salas.domain.GetUserService;
import com.inietojo.gestion_salas.integration.DniValidationResult;
import com.inietojo.gestion_salas.integration.DniValidator;
import com.inietojo.gestion_salas.integration.NotificationResult;
import com.inietojo.gestion_salas.integration.UserNotifier;
import com.inietojo.gestion_salas.persistence.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserAcceptanceTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CreateUserService createUserService;

    @Autowired
    private GetUserService getUserService;

    @MockitoBean
    private DniValidator dniValidator;

    @MockitoBean
    private UserNotifier userNotifier;

    private MockMvc mockMvc;
    @BeforeEach
    void setUp() {
        reset(dniValidator, userNotifier);
        userRepository.deleteAll();
        mockMvc = MockMvcBuilders
                .standaloneSetup(
                        new CreateUserController(createUserService),
                        new GetUserController(getUserService)
                )
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
        when(dniValidator.validate(any())).thenReturn(DniValidationResult.APPROVED);
        when(userNotifier.notify(any(), any(), any())).thenReturn(NotificationResult.SENT);
    }

    @Test
    void acceptsAdminCreatePersistsAndNotifiesByEmail() throws Exception {
        mockMvc.perform(post("/usuarios")
                        .contentType("application/json")
                        .content(json(Map.of(
                                "name", "Pablo",
                                "email", "Pablo@Example.com",
                                "phone", "677998899",
                                "rol", "admin",
                                "dni", "23454234W"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber());

        Long id = userRepository.findAll().get(0).getId();
        assertTrue(userRepository.findByIdAndRoom_Id(id, 1L).isPresent());
        assertEquals("pablo", userRepository.findById(id).orElseThrow().getName());
        verify(userNotifier).notify("admin", "pablo@example.com", "677998899");
    }

    @Test
    void acceptsSuperadminCreatePersistsAndNotifiesBySms() throws Exception {
        mockMvc.perform(post("/usuarios")
                        .contentType("application/json")
                        .content(json(Map.of(
                                "name", "Maria",
                                "email", "Maria@Example.com",
                                "phone", "600000000",
                                "rol", "superadmin",
                                "dni", "11111111A"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber());

        verify(userNotifier).notify("superadmin", "maria@example.com", "600000000");
    }

    @Test
    void rejectsDniAndDoesNotPersistOrNotify() throws Exception {
        when(dniValidator.validate("99999999w")).thenReturn(DniValidationResult.REJECTED);

        mockMvc.perform(post("/usuarios")
                        .contentType("application/json")
                        .content(json(Map.of(
                                "name", "Pablo",
                                "email", "dni@example.com",
                                "phone", "677998899",
                                "rol", "admin",
                                "dni", "99999999w"
                        ))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(409))
                .andExpect(jsonPath("$.message").value("error validation dni"));

        assertEquals(0, userRepository.count());
    }

    @Test
    void rejectsValidationAndDoesNotPersist() throws Exception {
        mockMvc.perform(post("/usuarios")
                        .contentType("application/json")
                        .content(json(Map.of(
                                "name", "DemasiadoLargo",
                                "email", "invalid",
                                "phone", "",
                                "rol", "otro",
                                "dni", ""
                        ))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(409))
                .andExpect(jsonPath("$.message").value("error validation userName"));

        assertEquals(0, userRepository.count());
    }

    @Test
    void rejectsDuplicateEmailWithoutCreatingAnotherRow() throws Exception {
        String input = json(Map.of(
                "name", "Pablo",
                "email", "duplicado@example.com",
                "phone", "677998899",
                "rol", "admin",
                "dni", "23454234W"
        ));

        mockMvc.perform(post("/usuarios").contentType("application/json").content(input))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/usuarios").contentType("application/json").content(input))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(409))
                .andExpect(jsonPath("$.message").value("error validation email"));

        assertEquals(1, userRepository.count());
    }

    @Test
    void returnsExistingUserAndMissingUserNotFound() throws Exception {
        mockMvc.perform(post("/usuarios")
                        .contentType("application/json")
                        .content(json(Map.of(
                                "name", "Pablo",
                                "email", "response@example.com",
                                "phone", "677998899",
                                "rol", "admin",
                                "dni", "23454234W"
                        ))))
                .andExpect(status().isCreated())
                .andReturn();

        Long id = userRepository.findAll().get(0).getId();

        mockMvc.perform(get("/usuarios/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.name").value("pablo"))
                .andExpect(jsonPath("$.email").value("response@example.com"))
                .andExpect(jsonPath("$.rol").value("admin"));

        mockMvc.perform(get("/usuarios/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(404))
                .andExpect(jsonPath("$.message").value("user not found"));
    }

    private String json(Map<String, String> values) throws Exception {
        StringBuilder json = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, String> entry : values.entrySet()) {
            if (!first) {
                json.append(",");
            }
            json.append("\"").append(entry.getKey()).append("\":\"")
                    .append(entry.getValue().replace("\\", "\\\\").replace("\"", "\\\""))
                    .append("\"");
            first = false;
        }
        return json.append("}").toString();
    }
}
