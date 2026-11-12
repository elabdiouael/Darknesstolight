package com.darktolight.api.dto;

import java.time.LocalDateTime;
import java.util.List;

/** DTOs dyal Khatma / Hifd / Profil (records = immutable w n9iyin) */
public final class KhatmaDtos {

    private KhatmaDtos() {}

    public record MemberDto(Long id, String username, boolean owner) {}

    public record KhatmaDto(
            Long id,
            String title,
            String template,
            Integer targetDays,
            Integer currentSurah,
            Integer currentAyah,
            Boolean completed,
            String inviteCode,
            boolean owner,
            List<MemberDto> members,
            String lastReadBy,
            LocalDateTime startedAt,
            LocalDateTime lastReadAt
    ) {}

    public record ActivityDto(Long id, String username, String type, Integer surah, Integer ayah, LocalDateTime createdAt) {}

    public record CreateKhatmaRequest(String title, String template, Integer targetDays) {}

    public record CheckpointRequest(int surah, int ayah, int ayahsRead) {}

    public record JoinRequest(String code) {}

    public record HifdStartRequest(int surah, int toAyah) {}

    public record HifdReviewRequest(int surah, int ayah, int quality) {}

    public record HifdSurahDto(int surah, int fromAyah, int toAyah, int count, int due, Integer avgScore) {}

    /** Programme dyal l-mouraja3a (GET/PUT /hifd/plan) */
    public record HifdPlanDto(String method, String preset, int dailyNew, int dailyReview, float intervalFactor,
                              int maxInterval, int passThreshold, int manzilDays, int recentDays, int hintWords) {}

    /** Aya f l-plan dyal l-youm. group = SABQI | MANZIL | WEAK | DUE */
    public record ReviewItemDto(int surah, int ayah, Integer lastScore, int intervalDays, String group) {}

    /** Sabaq: d-dars l-jdid dyal l-youm */
    public record SabaqDto(int surah, int fromAyah, int toAyah) {}

    public record HifdTodayDto(HifdPlanDto plan, List<ReviewItemDto> items, SabaqDto sabaq,
                               int dueTotal, int doneToday, int memorized) {}

    public record TasmiaRequest(int surah, int ayah, int accuracy, int mistakes) {}

    public record ReviewResultDto(int surah, int ayah, int quality, boolean passed, int intervalDays,
                                  String nextReviewDate, int points, int totalPoints) {}

    public record KhatiraDto(Long id, Integer surah, Integer ayah, String content, LocalDateTime createdAt) {}

    public record KhatiraRequest(int surah, int ayah, String content) {}

    public record MeDto(Long id, String username, String email, Integer nourPoints, Integer currentStreak, LocalDateTime createdAt) {}
}