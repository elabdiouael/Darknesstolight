package com.darktolight.api.models;

import jakarta.persistence.*;
import lombok.*;

/**
 * Programme dyal l-mouraja3a dyal kol user.
 * method = SM2 (spaced repetition adaptatif) awla MANZIL (Sabaq / Sabqi / Manzil, tari9a t-ta9lidiya).
 */
@Entity
@Table(name = "hifd_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HifdPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    private String method = "SM2";

    @Builder.Default
    private String preset = "BALANCED";

    @Builder.Default
    private Integer dailyNew = 3;        // Sabaq: ch7al mn aya jdida f nhar

    @Builder.Default
    private Integer dailyReview = 25;    // Max dyal l-mouraja3a f nhar

    @Builder.Default
    private Float intervalFactor = 1.0f; // SM-2: <1 = mouraja3a ktar, >1 = 9al

    @Builder.Default
    private Integer maxInterval = 60;    // Ktar mn hadchi ma kayb3adch l-mouraja3a

    @Builder.Default
    private Integer passThreshold = 85;  // % dyal tasmi3 bach t-t7seb najha

    @Builder.Default
    private Integer manzilDays = 7;      // MANZIL: l-7ifd l-9dim kaydour f had l-modda

    @Builder.Default
    private Integer recentDays = 7;      // MANZIL: Sabqi = li t7fed f had l-iyam

    @Builder.Default
    private Integer hintWords = 1;       // Ch7al mn kelma kat-ban f l-bdya (moussa3ada)
}