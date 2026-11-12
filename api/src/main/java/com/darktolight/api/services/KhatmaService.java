package com.darktolight.api.services;

import com.darktolight.api.dto.KhatmaDtos.*;
import com.darktolight.api.models.Khatma;
import com.darktolight.api.models.KhatmaActivity;
import com.darktolight.api.models.User;
import com.darktolight.api.repositories.KhatmaActivityRepository;
import com.darktolight.api.repositories.KhatmaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class KhatmaService {

    private static final Set<String> TEMPLATES = Set.of("fajr", "ramadan", "usra", "sakina");
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final KhatmaRepository khatmaRepository;
    private final KhatmaActivityRepository activityRepository;
    private final GamificationService gamificationService;

    @Transactional(readOnly = true)
    public List<KhatmaDto> listMine(User me) {
        return khatmaRepository.findAccessible(me.getId()).stream().map(k -> toDto(k, me)).toList();
    }

    @Transactional(readOnly = true)
    public KhatmaDto get(Long id, User me) {
        return toDto(loadAccessible(id, me), me);
    }

    @Transactional
    public KhatmaDto create(CreateKhatmaRequest req, User me) {
        String template = req.template() != null && TEMPLATES.contains(req.template()) ? req.template() : "fajr";
        String title = req.title() == null || req.title().isBlank() ? "Khatma" : req.title().trim();
        if (title.length() > 60) title = title.substring(0, 60);
        int days = req.targetDays() == null ? 30 : Math.max(1, Math.min(req.targetDays(), 365));

        Khatma k = khatmaRepository.save(Khatma.builder()
                .user(me).title(title).template(template).targetDays(days).build());
        log(k, me, "CREATE", 1, 1);
        return toDto(k, me);
    }

    @Transactional
    public KhatmaDto checkpoint(Long id, CheckpointRequest req, User me) {
        Khatma k = loadAccessible(id, me);
        if (req.surah() < 1 || req.surah() > 114 || req.ayah() < 1 || req.ayah() > 286) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid ayah");
        }
        k.setCurrentSurah(req.surah());
        k.setCurrentAyah(req.ayah());
        k.setLastReadBy(me);
        // Akhir aya f l-Quran = An-Nas 6
        boolean done = req.surah() == 114 && req.ayah() >= 6;
        k.setIsCompleted(done);
        khatmaRepository.save(k);

        int read = Math.max(0, Math.min(req.ayahsRead(), 6236));
        if (read > 0) gamificationService.awardPointsAndCheckStreak(me, read);
        log(k, me, done ? "COMPLETE" : "CHECKPOINT", req.surah(), req.ayah());
        return toDto(k, me);
    }

    @Transactional
    public KhatmaDto share(Long id, User me) {
        Khatma k = loadAccessible(id, me);
        if (k.getInviteCode() == null) {
            String code;
            do { code = randomCode(); } while (khatmaRepository.findByInviteCode(code).isPresent());
            k.setInviteCode(code);
            khatmaRepository.save(k);
        }
        return toDto(k, me);
    }

    @Transactional
    public KhatmaDto join(String rawCode, User me) {
        String code = rawCode == null ? "" : rawCode.trim().toUpperCase();
        Khatma k = khatmaRepository.findByInviteCode(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Code introuvable"));
        boolean already = k.getUser().getId().equals(me.getId())
                || k.getMembers().stream().anyMatch(m -> m.getId().equals(me.getId()));
        if (!already) {
            if (k.getMembers().size() >= 20) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Room complète");
            }
            k.getMembers().add(me);
            khatmaRepository.save(k);
            log(k, me, "JOIN", k.getCurrentSurah(), k.getCurrentAyah());
        }
        return toDto(k, me);
    }

    @Transactional
    public void leaveOrDelete(Long id, User me) {
        Khatma k = loadAccessible(id, me);
        if (k.getUser().getId().equals(me.getId())) {
            activityRepository.deleteByKhatmaId(k.getId());
            khatmaRepository.delete(k);
        } else {
            k.getMembers().removeIf(m -> m.getId().equals(me.getId()));
            khatmaRepository.save(k);
        }
    }

    @Transactional(readOnly = true)
    public List<ActivityDto> activity(Long id, User me) {
        Khatma k = loadAccessible(id, me);
        return activityRepository.findTop30ByKhatmaIdOrderByCreatedAtDesc(k.getId()).stream()
                .map(a -> new ActivityDto(a.getId(), a.getUser().getUsername(), a.getType(),
                        a.getSurah(), a.getAyah(), a.getCreatedAt()))
                .toList();
    }

    // ---------- helpers ----------

    private Khatma loadAccessible(Long id, User me) {
        Khatma k = khatmaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khatma introuvable"));
        boolean allowed = k.getUser().getId().equals(me.getId())
                || k.getMembers().stream().anyMatch(m -> m.getId().equals(me.getId()));
        if (!allowed) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        return k;
    }

    private void log(Khatma k, User u, String type, Integer surah, Integer ayah) {
        activityRepository.save(KhatmaActivity.builder()
                .khatma(k).user(u).type(type).surah(surah).ayah(ayah).build());
    }

    private String randomCode() {
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
        return sb.toString();
    }

    private KhatmaDto toDto(Khatma k, User me) {
        List<MemberDto> members = new ArrayList<>();
        members.add(new MemberDto(k.getUser().getId(), k.getUser().getUsername(), true));
        k.getMembers().stream()
                .sorted(Comparator.comparing(User::getUsername))
                .forEach(m -> members.add(new MemberDto(m.getId(), m.getUsername(), false)));

        return new KhatmaDto(
                k.getId(),
                k.getTitle() == null ? "Khatma" : k.getTitle(),
                k.getTemplate() == null ? "fajr" : k.getTemplate(),
                k.getTargetDays() == null ? 30 : k.getTargetDays(),
                k.getCurrentSurah(),
                k.getCurrentAyah(),
                Boolean.TRUE.equals(k.getIsCompleted()),
                k.getInviteCode(),
                k.getUser().getId().equals(me.getId()),
                members,
                k.getLastReadBy() == null ? null : k.getLastReadBy().getUsername(),
                k.getStartedAt(),
                k.getLastReadAt()
        );
    }
}