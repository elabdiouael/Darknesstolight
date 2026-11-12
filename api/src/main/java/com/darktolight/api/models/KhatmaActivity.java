package com.darktolight.api.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/** Journal dyal l-khatma: chkoun dar checkpoint fin, chkoun dkhel l-room... */
@Entity
@Table(name = "khatma_activity")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KhatmaActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "khatma_id", nullable = false)
    private Khatma khatma;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // CHECKPOINT | JOIN | CREATE | COMPLETE
    @Column(nullable = false)
    private String type;

    private Integer surah;
    private Integer ayah;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}