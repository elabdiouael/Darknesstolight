package com.darktolight.api.controllers;

import com.darktolight.api.models.DuoKhatmaRoom;
import com.darktolight.api.models.HifdRecord;
import com.darktolight.api.models.Khatma;
import com.darktolight.api.models.Khawatir;
import com.darktolight.api.models.User;
import com.darktolight.api.repositories.DuoKhatmaRoomRepository;
import com.darktolight.api.repositories.HifdRecordRepository;
import com.darktolight.api.repositories.KhatmaRepository;
import com.darktolight.api.repositories.KhawatirRepository;
import com.darktolight.api.repositories.UserRepository;
import com.darktolight.api.services.HifdService;
import com.darktolight.api.services.ProgressService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;
    private final HifdService hifdService;
    private final UserRepository userRepository;
    private final KhatmaRepository khatmaRepository;
    private final DuoKhatmaRoomRepository duoRoomRepository;
    private final KhawatirRepository khawatirRepository;
    private final HifdRecordRepository hifdRecordRepository;

    private User getAuthenticatedUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping("/me")
    public ResponseEntity<DashboardResponseDto> getMyDashboard(Authentication auth) {
        User user = getAuthenticatedUser(auth);

        List<Khatma> khatmas = khatmaRepository.findByUserIdOrderByLastReadAtDesc(user.getId());
        Khatma activeKhatma;
        if (khatmas.isEmpty()) {
            activeKhatma = khatmaRepository.save(Khatma.builder()
                    .user(user)
                    .currentSurah(1)
                    .currentAyah(1)
                    .isCompleted(false)
                    .build());
        } else {
            activeKhatma = khatmas.get(0);
        }

        List<DuoKhatmaRoom> rawRooms = duoRoomRepository
                .findByCreatorIdOrPartnerIdOrderByLastReadAtDesc(user.getId(), user.getId());
        List<DuoRoomDto> duoRooms = new ArrayList<>();
        for (DuoKhatmaRoom r : rawRooms) {
            String partnerName = r.getPartner() != null ? r.getPartner().getUsername() : "Waiting for Partner...";
            String lastReader = r.getLastReadBy() != null ? r.getLastReadBy().getUsername() : "Start reading!";
            duoRooms.add(new DuoRoomDto(
                    r.getId(),
                    r.getRoomCode(),
                    r.getCreator().getUsername(),
                    partnerName,
                    r.getCurrentSurah(),
                    r.getCurrentAyah(),
                    lastReader
            ));
        }

        List<Khawatir> rawKhawatir = khawatirRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        List<KhawatirDto> khawatirList = new ArrayList<>();
        for (Khawatir k : rawKhawatir) {
            khawatirList.add(new KhawatirDto(
                    k.getId(),
                    k.getSurahNumber(),
                    k.getAyahNumber(),
                    k.getContent(),
                    k.getCreatedAt()
            ));
        }

        List<HifdRecord> rawHifd = hifdRecordRepository.findByUserIdOrderBySurahNumberAscAyahNumberAsc(user.getId());
        List<HifdDto> hifdList = new ArrayList<>();
        for (HifdRecord h : rawHifd) {
            boolean isDue = !h.getNextReviewDate().isAfter(LocalDate.now());
            hifdList.add(new HifdDto(
                    h.getId(),
                    h.getSurahNumber(),
                    h.getAyahNumber(),
                    h.getRepetitions(),
                    h.getIntervalDays(),
                    h.getEaseFactor(),
                    h.getNextReviewDate(),
                    isDue
            ));
        }

        DashboardResponseDto response = new DashboardResponseDto(
                user.getId(),
                user.getUsername(),
                user.getNourPoints(),
                user.getCurrentStreak(),
                new KhatmaDto(activeKhatma.getId(), activeKhatma.getCurrentSurah(), activeKhatma.getCurrentAyah()),
                duoRooms,
                khawatirList,
                hifdList
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/khatma/update")
    public ResponseEntity<String> updatePersonalKhatma(
            Authentication auth,
            @RequestBody UpdateKhatmaRequest req) {
        User user = getAuthenticatedUser(auth);
        List<Khatma> khatmas = khatmaRepository.findByUserIdOrderByLastReadAtDesc(user.getId());
        if (khatmas.isEmpty()) {
            return ResponseEntity.badRequest().body("Ma kayna 7ta khatma");
        }
        Khatma active = khatmas.get(0);
        progressService.updatePersonalKhatma(active.getId(), user.getId(), req.getSurah(), req.getAyah(), req.getAyahsRead());
        return ResponseEntity.ok("Progress updated!");
    }

    @PostMapping("/duo/create")
    public ResponseEntity<String> createDuoRoom(Authentication auth) {
        User user = getAuthenticatedUser(auth);
        return ResponseEntity.ok(progressService.createDuoRoom(user.getId()));
    }

    @PostMapping("/duo/join")
    public ResponseEntity<String> joinDuoRoom(Authentication auth, @RequestBody JoinDuoRequest req) {
        User user = getAuthenticatedUser(auth);
        progressService.joinDuoRoom(user.getId(), req.getRoomCode().trim().toUpperCase());
        return ResponseEntity.ok("Joined room!");
    }

    @PostMapping("/duo/{roomCode}/update")
    public ResponseEntity<String> updateDuoProgress(
            Authentication auth,
            @PathVariable String roomCode,
            @RequestBody UpdateKhatmaRequest req) {
        User user = getAuthenticatedUser(auth);
        progressService.updateDuoKhatmaProgress(roomCode, user.getId(), req.getSurah(), req.getAyah(), req.getAyahsRead());
        return ResponseEntity.ok("Duo Khatma updated!");
    }

    @PostMapping("/khawatir/add")
    public ResponseEntity<KhawatirDto> addKhawatir(
            Authentication auth,
            @RequestBody AddKhawatirRequest req) {
        User user = getAuthenticatedUser(auth);
        Khawatir saved = khawatirRepository.save(Khawatir.builder()
                .user(user)
                .surahNumber(req.getSurah())
                .ayahNumber(req.getAyah())
                .content(req.getContent())
                .build());
        return ResponseEntity.ok(new KhawatirDto(saved.getId(), saved.getSurahNumber(), saved.getAyahNumber(), saved.getContent(), saved.getCreatedAt()));
    }

    @DeleteMapping("/khawatir/{id}")
    public ResponseEntity<String> deleteKhawatir(Authentication auth, @PathVariable Long id) {
        User user = getAuthenticatedUser(auth);
        Khawatir note = khawatirRepository.findById(id).orElseThrow();
        if (note.getUser().getId().equals(user.getId())) {
            khawatirRepository.delete(note);
        }
        return ResponseEntity.ok("Deleted");
    }

    @PostMapping("/hifd/review")
    public ResponseEntity<HifdDto> reviewHifd(
            Authentication auth,
            @RequestBody ReviewHifdRequest req) {
        User user = getAuthenticatedUser(auth);
        // reviewAyah daba kat-rje3 ReviewResultDto -> n-jebdo l-record mn la base
        hifdService.reviewAyah(user, req.getSurah(), req.getAyah(), req.getQuality());
        HifdRecord h = hifdRecordRepository
                .findByUserIdAndSurahNumberAndAyahNumber(user.getId(), req.getSurah(), req.getAyah())
                .orElseThrow();
        boolean isDue = !h.getNextReviewDate().isAfter(LocalDate.now());
        return ResponseEntity.ok(new HifdDto(
                h.getId(),
                h.getSurahNumber(),
                h.getAyahNumber(),
                h.getRepetitions(),
                h.getIntervalDays(),
                h.getEaseFactor(),
                h.getNextReviewDate(),
                isDue
        ));
    }

    @DeleteMapping("/hifd/{id}")
    public ResponseEntity<String> deleteHifd(Authentication auth, @PathVariable Long id) {
        User user = getAuthenticatedUser(auth);
        HifdRecord record = hifdRecordRepository.findById(id).orElseThrow();
        if (record.getUser().getId().equals(user.getId())) {
            hifdRecordRepository.delete(record);
        }
        return ResponseEntity.ok("Deleted");
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DashboardResponseDto {
        private Long userId;
        private String username;
        private Integer nourPoints;
        private Integer currentStreak;
        private KhatmaDto activeKhatma;
        private List<DuoRoomDto> duoRooms;
        private List<KhawatirDto> khawatir;
        private List<HifdDto> hifdRecords;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class KhatmaDto {
        private Long id;
        private Integer currentSurah;
        private Integer currentAyah;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DuoRoomDto {
        private Long id;
        private String roomCode;
        private String creatorUsername;
        private String partnerUsername;
        private Integer currentSurah;
        private Integer currentAyah;
        private String lastReadBy;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class KhawatirDto {
        private Long id;
        private Integer surahNumber;
        private Integer ayahNumber;
        private String content;
        private LocalDateTime createdAt;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class HifdDto {
        private Long id;
        private Integer surahNumber;
        private Integer ayahNumber;
        private Integer repetitions;
        private Integer intervalDays;
        private Float easeFactor;
        private LocalDate nextReviewDate;
        private boolean dueToday;
    }

    @Data
    public static class UpdateKhatmaRequest {
        private int surah;
        private int ayah;
        private int ayahsRead;
    }

    @Data
    public static class JoinDuoRequest {
        private String roomCode;
    }

    @Data
    public static class AddKhawatirRequest {
        private int surah;
        private int ayah;
        private String content;
    }

    @Data
    public static class ReviewHifdRequest {
        private int surah;
        private int ayah;
        private int quality;
    }
}