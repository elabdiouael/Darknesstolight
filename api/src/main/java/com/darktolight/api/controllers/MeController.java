package com.darktolight.api.controllers;

import com.darktolight.api.dto.KhatmaDtos.MeDto;
import com.darktolight.api.models.User;
import com.darktolight.api.services.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
public class MeController {

    private final CurrentUserService currentUser;

    @GetMapping
    public MeDto me() {
        User u = currentUser.get();
        return new MeDto(u.getId(), u.getUsername(), u.getEmail(), u.getNourPoints(), u.getCurrentStreak(), u.getCreatedAt());
    }
}