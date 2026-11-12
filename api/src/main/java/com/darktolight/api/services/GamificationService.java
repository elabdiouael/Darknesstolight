package com.darktolight.api.services;

import com.darktolight.api.models.User;
import com.darktolight.api.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
public class GamificationService {

    private final UserRepository userRepository;

    /** Points dyal l-9raya: 5 l kol aya (+ streak) */
    @Transactional
    public User awardPointsAndCheckStreak(User user, int ayahsReadCount) {
        return award(user, ayahsReadCount * 5);
    }

    /** Points dyal l-7ifd (tasmi3 / mouraja3a) */
    @Transactional
    public User awardHifdPoints(User user, int points) {
        return award(user, points);
    }

    private User award(User user, int basePoints) {
        LocalDateTime now = LocalDateTime.now();

        // 1. Calcul dyal Streak (Istimrariya)
        if (user.getLastReadDate() != null) {
            LocalDate lastRead = user.getLastReadDate().toLocalDate();
            LocalDate today = now.toLocalDate();

            if (lastRead.isEqual(today.minusDays(1))) {
                user.setCurrentStreak(nz(user.getCurrentStreak()) + 1); // Zado nhar
            } else if (lastRead.isBefore(today.minusDays(1))) {
                user.setCurrentStreak(1); // T9t3at l-streak, kay3awd mn 1
            }
            // Ila kan today == today, makat-tbdelch l-streak
        } else {
            user.setCurrentStreak(1); // Awel nhar lihe
        }
        user.setLastReadDate(now);

        // 2. Bonus we9t Fajr awla Qiyam Lail (bin 3:00 w 6:00) -> double
        LocalTime timeNow = now.toLocalTime();
        int points = basePoints;
        if (timeNow.isAfter(LocalTime.of(3, 0)) && timeNow.isBefore(LocalTime.of(6, 0))) {
            points *= 2;
        }

        user.setNourPoints(nz(user.getNourPoints()) + Math.max(0, points));
        return userRepository.save(user);
    }

    private static int nz(Integer v) { return v == null ? 0 : v; }
}