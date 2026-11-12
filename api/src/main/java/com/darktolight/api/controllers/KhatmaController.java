package com.darktolight.api.controllers;

import com.darktolight.api.dto.KhatmaDtos.*;
import com.darktolight.api.services.CurrentUserService;
import com.darktolight.api.services.KhatmaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/khatma")
@RequiredArgsConstructor
public class KhatmaController {

    private final KhatmaService khatmaService;
    private final CurrentUserService currentUser;

    @GetMapping
    public List<KhatmaDto> list() {
        return khatmaService.listMine(currentUser.get());
    }

    @PostMapping
    public KhatmaDto create(@RequestBody CreateKhatmaRequest req) {
        return khatmaService.create(req, currentUser.get());
    }

    @GetMapping("/{id}")
    public KhatmaDto get(@PathVariable Long id) {
        return khatmaService.get(id, currentUser.get());
    }

    @PutMapping("/{id}/checkpoint")
    public KhatmaDto checkpoint(@PathVariable Long id, @RequestBody CheckpointRequest req) {
        return khatmaService.checkpoint(id, req, currentUser.get());
    }

    @PostMapping("/{id}/share")
    public KhatmaDto share(@PathVariable Long id) {
        return khatmaService.share(id, currentUser.get());
    }

    @PostMapping("/join")
    public KhatmaDto join(@RequestBody JoinRequest req) {
        return khatmaService.join(req.code(), currentUser.get());
    }

    @GetMapping("/{id}/activity")
    public List<ActivityDto> activity(@PathVariable Long id) {
        return khatmaService.activity(id, currentUser.get());
    }

    // Owner -> kaymseh l-khatma, member -> kaykhrej mnha
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        khatmaService.leaveOrDelete(id, currentUser.get());
        return ResponseEntity.noContent().build();
    }
}