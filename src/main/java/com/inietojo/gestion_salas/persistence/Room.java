package com.inietojo.gestion_salas.persistence;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "gestion_salas_sala")
@SequenceGenerator(
        name = "sala_id_generator",
        sequenceName = "gestion_salas_sala_seq",
        allocationSize = 1,
        initialValue = 2
)
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sala_id_generator")
    private Long id;

    @OneToMany(mappedBy = "room", fetch = FetchType.LAZY)
    private List<User> users = new ArrayList<>();

    protected Room() {
    }

    public Room(Long id) {
        this.id = id;
    }

    public Long getId() {
        return id;
    }

    public List<User> getUsers() {
        return users;
    }
}
