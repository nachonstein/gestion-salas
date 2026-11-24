package com.inietojo.gestion_salas.persistence;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.persistence.Column;

import java.util.Locale;

@Entity
@Table(name = "gestion_salas_usuario")
@SequenceGenerator(
        name = "usuario_id_generator",
        sequenceName = "gestion_salas_usuario_seq",
        allocationSize = 1
)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "usuario_id_generator")
    private Long id;

    @Column(nullable = false, length = 6)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false, length = 20)
    private String rol;

    @Column(nullable = false)
    private String dni;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sala_id", nullable = false)
    private Room room;

    protected User() {
    }

    public User(String name, String email, String phone, String rol, String dni, Room room) {
        this.name = name;
        this.email = normalizeEmail(email);
        this.phone = phone;
        this.rol = rol;
        this.dni = dni;
        this.room = room;
    }

    @PrePersist
    @PreUpdate
    private void normalizeEmailBeforeWrite() {
        email = normalizeEmail(email);
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.toLowerCase(Locale.ROOT);
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getRol() {
        return rol;
    }

    public String getDni() {
        return dni;
    }

    public Room getRoom() {
        return room;
    }
}
