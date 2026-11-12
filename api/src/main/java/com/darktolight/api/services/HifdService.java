package com.darktolight.api.services;

import com.darktolight.api.dto.KhatmaDtos.*;
import com.darktolight.api.models.HifdPlan;
import com.darktolight.api.models.HifdRecord;
import com.darktolight.api.models.User;
import com.darktolight.api.repositories.HifdPlanRepository;
import com.darktolight.api.repositories.HifdRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class HifdService {

    /** 3adad l-ayat dyal kol sourate (1..114) */
    private static final int[] VERSES = {
            7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77,
            227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62,
            55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29,
            19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
    };

    private final HifdRecordRepository hifdRepository;
    private final HifdPlanRepository planRepository;
    private final GamificationService gamificationService;

    private static void checkAyah(int surah, int ayah) {
        if (surah < 1 || surah > 114 || ayah < 1 || ayah > VERSES[surah - 1]) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid ayah");
        }
    }

    private static int nz(Integer v) { return v == null ? 0 : v; }

    // ===================== Programme =====================

    @Transactional
    public HifdPlan planFor(User user) {
        return planRepository.findByUserId(user.getId())
                .orElseGet(() -> planRepository.save(HifdPlan.builder().user(user).build()));
    }

    public static HifdPlanDto toDto(HifdPlan p) {
        return new HifdPlanDto(p.getMethod(), p.getPreset(), p.getDailyNew(), p.getDailyReview(), p.getIntervalFactor(),
                p.getMaxInterval(), p.getPassThreshold(), p.getManzilDays(), p.getRecentDays(), p.getHintWords());
    }

    @Transactional
    public HifdPlanDto updatePlan(User user, HifdPlanDto req) {
        HifdPlan p = planFor(user);
        p.setMethod("MANZIL".equals(req.method()) ? "MANZIL" : "SM2");
        p.setPreset(req.preset() != null && Set.of("INTENSIVE", "BALANCED", "LIGHT", "CUSTOM").contains(req.preset()) ? req.preset() : "CUSTOM");
        p.setDailyNew(clamp(req.dailyNew(), 1, 50));
        p.setDailyReview(clamp(req.dailyReview(), 5, 300));
        p.setIntervalFactor(Math.max(0.3f, Math.min(3f, req.intervalFactor())));
        p.setMaxInterval(clamp(req.maxInterval(), 3, 365));
        p.setPassThreshold(clamp(req.passThreshold(), 50, 100));
        p.setManzilDays(clamp(req.manzilDays(), 3, 60));
        p.setRecentDays(clamp(req.recentDays(), 1, 30));
        p.setHintWords(clamp(req.hintWords(), 0, 3));
        return toDto(planRepository.save(p));
    }

    private static int clamp(int v, int min, int max) { return Math.max(min, Math.min(max, v)); }

    // ===================== 7ifd =====================

    /**
     * L-user khtar aya f l-khatma w bgha y-7fed: kan-zido ga3 l-ayat
     * mn bdya dyal s-sourate (aya 1) hta l-aya li khtar.
     */
    @Transactional
    public HifdSurahDto startFromSurahBeginning(User user, int surah, int toAyah) {
        checkAyah(surah, toAyah);
        Set<Integer> existing = new HashSet<>();
        hifdRepository.findByUserIdAndSurahNumber(user.getId(), surah)
                .forEach(r -> existing.add(r.getAyahNumber()));

        LocalDate today = LocalDate.now();
        List<HifdRecord> toSave = new ArrayList<>();
        for (int a = 1; a <= toAyah; a++) {
            if (existing.contains(a)) continue;
            toSave.add(HifdRecord.builder()
                    .user(user).surahNumber(surah).ayahNumber(a)
                    .nextReviewDate(today).memorizedAt(today)
                    .build());
        }
        hifdRepository.saveAll(toSave);
        return summary(user).stream().filter(s -> s.surah() == surah).findFirst().orElseThrow();
    }

    @Transactional(readOnly = true)
    public List<HifdSurahDto> summary(User user) {
        Map<Integer, List<HifdRecord>> bySurah = new TreeMap<>();
        for (HifdRecord r : hifdRepository.findByUserIdOrderBySurahNumberAscAyahNumberAsc(user.getId())) {
            bySurah.computeIfAbsent(r.getSurahNumber(), k -> new ArrayList<>()).add(r);
        }
        LocalDate today = LocalDate.now();
        List<HifdSurahDto> out = new ArrayList<>();
        bySurah.forEach((surah, list) -> {
            int from = list.stream().mapToInt(HifdRecord::getAyahNumber).min().orElse(1);
            int to = list.stream().mapToInt(HifdRecord::getAyahNumber).max().orElse(1);
            int due = (int) list.stream().filter(r -> !r.getNextReviewDate().isAfter(today)).count();
            OptionalDouble avg = list.stream().filter(r -> r.getLastScore() != null).mapToInt(HifdRecord::getLastScore).average();
            out.add(new HifdSurahDto(surah, from, to, list.size(), due, avg.isPresent() ? (int) Math.round(avg.getAsDouble()) : null));
        });
        return out;
    }

    /** Plan dyal l-youm: Sabaq (jdid) + l-mouraja3a mrtba (Sabqi/Manzil awla Weak/Due) */
    @Transactional
    public HifdTodayDto today(User user) {
        HifdPlan plan = planFor(user);
        LocalDate today = LocalDate.now();
        List<HifdRecord> all = hifdRepository.findByUserIdOrderBySurahNumberAscAyahNumberAsc(user.getId());

        List<HifdRecord> due = all.stream()
                .filter(r -> !r.getNextReviewDate().isAfter(today))
                .sorted(Comparator.comparing(HifdRecord::getNextReviewDate)
                        .thenComparing(HifdRecord::getSurahNumber)
                        .thenComparing(HifdRecord::getAyahNumber))
                .toList();

        boolean manzil = "MANZIL".equals(plan.getMethod());
        LocalDate recentLimit = today.minusDays(plan.getRecentDays());
        List<ReviewItemDto> items = due.stream().limit(plan.getDailyReview()).map(r -> {
                    String group;
                    if (manzil) {
                        group = r.getMemorizedAt() != null && !r.getMemorizedAt().isBefore(recentLimit) ? "SABQI" : "MANZIL";
                    } else {
                        boolean weak = (r.getLastScore() != null && r.getLastScore() < plan.getPassThreshold())
                                || (r.getEaseFactor() != null && r.getEaseFactor() < 2.0f);
                        group = weak ? "WEAK" : "DUE";
                    }
                    return new ReviewItemDto(r.getSurahNumber(), r.getAyahNumber(), r.getLastScore(), nz(r.getIntervalDays()), group);
                }).sorted(Comparator.comparing(ReviewItemDto::group).thenComparing(ReviewItemDto::surah).thenComparing(ReviewItemDto::ayah))
                .toList();

        int doneToday = (int) all.stream().filter(r -> today.equals(r.getLastReviewedAt())).count();
        return new HifdTodayDto(toDto(plan), items, sabaq(all, plan), due.size(), doneToday, all.size());
    }

    /** Sabaq: n-kemlo f s-sourate li bdina fiha akhir merra */
    private SabaqDto sabaq(List<HifdRecord> all, HifdPlan plan) {
        if (all.isEmpty()) return new SabaqDto(1, 1, Math.min(plan.getDailyNew(), VERSES[0]));
        HifdRecord last = all.stream()
                .max(Comparator.comparing((HifdRecord r) -> r.getMemorizedAt() == null ? LocalDate.MIN : r.getMemorizedAt())
                        .thenComparing(HifdRecord::getId))
                .orElseThrow();
        int surah = last.getSurahNumber();
        Set<Integer> have = new HashSet<>();
        all.stream().filter(r -> r.getSurahNumber() == surah).forEach(r -> have.add(r.getAyahNumber()));
        int from = 1;
        while (from <= VERSES[surah - 1] && have.contains(from)) from++;
        if (from > VERSES[surah - 1]) {
            // S-sourate kmlat -> n-9tar7o l-jaya (ila ma bditihach)
            int next = surah % 114 + 1;
            boolean started = all.stream().anyMatch(r -> r.getSurahNumber() == next);
            if (started) return null;
            return new SabaqDto(next, 1, Math.min(plan.getDailyNew(), VERSES[next - 1]));
        }
        return new SabaqDto(surah, from, Math.min(VERSES[surah - 1], from + plan.getDailyNew() - 1));
    }

    // ===================== Mouraja3a =====================

    /** Mouraja3a b t-ta9yim dyal l-user (0..5) */
    @Transactional
    public ReviewResultDto reviewAyah(User user, int surah, int ayah, int quality) {
        checkAyah(surah, ayah);
        int q = Math.max(0, Math.min(5, quality));
        HifdPlan plan = planFor(user);
        HifdRecord record = findOrNew(user, surah, ayah);
        schedule(record, q, plan);
        hifdRepository.save(record);
        User u = gamificationService.awardHifdPoints(user, q >= 3 ? 3 : 1);
        return result(record, q, q >= 3, q >= 3 ? 3 : 1, u);
    }

    /** Tasmi3: l-user 9ra b sawto, l-frontend 7seb l-accuracy (0..100) */
    @Transactional
    public ReviewResultDto tasmia(User user, int surah, int ayah, int accuracy, int mistakes) {
        checkAyah(surah, ayah);
        int acc = Math.max(0, Math.min(100, accuracy));
        HifdPlan plan = planFor(user);
        int q = qualityFromAccuracy(acc, plan.getPassThreshold());
        boolean passed = acc >= plan.getPassThreshold();

        HifdRecord record = findOrNew(user, surah, ayah);
        record.setLastScore(acc);
        record.setBestScore(Math.max(nz(record.getBestScore()), acc));
        record.setAttempts(nz(record.getAttempts()) + 1);
        schedule(record, q, plan);
        hifdRepository.save(record);

        int points = passed ? 10 + (acc >= 98 ? 5 : 0) + (mistakes == 0 ? 2 : 0) : (acc >= 50 ? 2 : 0);
        User u = gamificationService.awardHifdPoints(user, points);
        return result(record, q, passed, points, u);
    }

    public static int qualityFromAccuracy(int acc, int pass) {
        if (acc >= 98) return 5;
        if (acc >= Math.max(pass, 88)) return 4;
        if (acc >= pass) return 3;
        if (acc >= pass - 20) return 2;
        if (acc >= 30) return 1;
        return 0;
    }

    private HifdRecord findOrNew(User user, int surah, int ayah) {
        LocalDate today = LocalDate.now();
        return hifdRepository.findByUserIdAndSurahNumberAndAyahNumber(user.getId(), surah, ayah)
                .orElseGet(() -> HifdRecord.builder().user(user).surahNumber(surah).ayahNumber(ayah)
                        .nextReviewDate(today).memorizedAt(today).build());
    }

    /** Scheduling 3la 7sab l-programme (SM-2 adaptatif awla Sabaq/Sabqi/Manzil) */
    private void schedule(HifdRecord r, int q, HifdPlan plan) {
        LocalDate today = LocalDate.now();
        int reps = nz(r.getRepetitions());
        int interval = nz(r.getIntervalDays());
        float ease = r.getEaseFactor() == null ? 2.5f : r.getEaseFactor();

        if (q < 3) {
            reps = 0;
            interval = 1;
        } else if ("MANZIL".equals(plan.getMethod())) {
            reps++;
            boolean recent = r.getMemorizedAt() != null && !r.getMemorizedAt().isBefore(today.minusDays(plan.getRecentDays()));
            // Sabqi: kol nhar. Manzil: dawra kamla kol manzilDays (a7san ta9yim = ab3ad chwiya)
            interval = recent ? 1 : (q == 5 ? plan.getManzilDays() + plan.getManzilDays() / 2 : plan.getManzilDays());
        } else {
            reps++;
            if (reps == 1) interval = 1;
            else if (reps == 2) interval = Math.max(2, Math.round(6 * plan.getIntervalFactor()));
            else interval = Math.round(Math.max(1, interval) * ease);
        }

        ease = Math.max(1.3f, ease + (0.1f - (5 - q) * (0.08f + (5 - q) * 0.02f)));
        interval = Math.max(1, Math.min(plan.getMaxInterval(), interval));

        if (r.getMemorizedAt() == null) r.setMemorizedAt(today);
        r.setRepetitions(reps);
        r.setIntervalDays(interval);
        r.setEaseFactor(ease);
        r.setLastReviewedAt(today);
        r.setNextReviewDate(today.plusDays(interval));
    }

    private static ReviewResultDto result(HifdRecord r, int q, boolean passed, int points, User u) {
        return new ReviewResultDto(r.getSurahNumber(), r.getAyahNumber(), q, passed, r.getIntervalDays(),
                r.getNextReviewDate().toString(), points, nz(u.getNourPoints()));
    }
}