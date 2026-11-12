package com.darktolight.api.controllers;

import com.darktolight.api.dto.KhatmaDtos.*;
import com.darktolight.api.services.CurrentUserService;
import com.darktolight.api.services.HifdService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/hifd")
@RequiredArgsConstructor
public class HifdController {

    private final HifdService hifdService;
    private final CurrentUserService currentUser;

    @GetMapping
    public List<HifdSurahDto> summary() {
        return hifdService.summary(currentUser.get());
    }

    // Zid l-ayat mn bdya dyal s-sourate hta toAyah l-7ifd
    @PostMapping("/start")
    public HifdSurahDto start(@RequestBody HifdStartRequest req) {
        return hifdService.startFromSurahBeginning(currentUser.get(), req.surah(), req.toAyah());
    }

    // Mouraja3a b ta9yim dyal l-user (0..5)
    @PostMapping("/review")
    public ReviewResultDto review(@RequestBody HifdReviewRequest req) {
        return hifdService.reviewAyah(currentUser.get(), req.surah(), req.ayah(), req.quality());
    }

    // Tasmi3 b s-sawt: accuracy (0..100) m7soub f l-frontend
    @PostMapping("/tasmia")
    public ReviewResultDto tasmia(@RequestBody TasmiaRequest req) {
        return hifdService.tasmia(currentUser.get(), req.surah(), req.ayah(), req.accuracy(), req.mistakes());
    }

    // Plan dyal l-youm (Sabaq + mouraja3a)
    @GetMapping("/today")
    public HifdTodayDto today() {
        return hifdService.today(currentUser.get());
    }

    @GetMapping("/plan")
    public HifdPlanDto plan() {
        return HifdService.toDto(hifdService.planFor(currentUser.get()));
    }

    @PutMapping("/plan")
    public HifdPlanDto updatePlan(@RequestBody HifdPlanDto req) {
        return hifdService.updatePlan(currentUser.get(), req);
    }
}