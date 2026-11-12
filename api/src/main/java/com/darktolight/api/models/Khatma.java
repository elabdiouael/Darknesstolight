package com.darktolight.api.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Khatma = template dyal l-user (titre + thème + objectif) w checkpoint (surah/ayah).
 * Y9der ypartagiha m3a nass khrin b inviteCode -> kaywelliw members w kaykemmlou m3ah.
 */
@Entity
@Table(name = "khatmas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Khatma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mol l-khatma (owner)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String title;

    // Template visuel: "fajr", "ramadan", "usra", "sakina"
    private String template;

    // Objectif b l-iyam (ex: 30 = khatma f ch'her)
    private Integer targetDays;

    // Checkpoint
    @Column(nullable = false)
    @Builder.Default
    private Integer currentSurah = 1;

    @Column(nullable = false)
    @Builder.Default
    private Integer currentAyah = 1;

    @Builder.Default
    private Boolean isCompleted = false;

    // Code dyal l-partage (null ila mazal ma tpartagatch)
    @Column(unique = true)
    private String inviteCode;

    // Nass li kaykemmlou m3ah l-khatma
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "khatma_members",
            joinColumns = @JoinColumn(name = "khatma_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id"))
    @Builder.Default
    private Set<User> members = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_read_by")
    private User lastReadBy;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime startedAt;

    @UpdateTimestamp
    private LocalDateTime lastReadAt;
}