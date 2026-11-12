package com.darktolight.api.controllers;

import com.darktolight.api.dto.KhatmaDtos.KhatiraDto;
import com.darktolight.api.dto.KhatmaDtos.KhatiraRequest;
import com.darktolight.api.models.Khawatir;
import com.darktolight.api.models.User;
import com.darktolight.api.repositories.KhawatirRepository;
import com.darktolight.api.services.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/** Khawatir = tadabbur / réflexions dyal l-user 3la aya mo3ayana */
@RestController
@RequestMapping("/api/v1/khawatir")
@RequiredArgsConstructor
public class KhawatirController {

    private final KhawatirRepository khawatirRepository;
    private final CurrentUserService currentUser;

    @GetMapping
    public List<KhatiraDto> list() {
        return khawatirRepository.findByUserIdOrderByCreatedAtDesc(currentUser.get().getId())
                .stream().map(this::toDto).toList();
    }

    @PostMapping
    public KhatiraDto add(@RequestBody KhatiraRequest req) {
        String content = req.content() == null ? "" : req.content().trim();
        if (content.isEmpty() || content.length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contenu invalide");
        }
        if (req.surah() < 1 || req.surah() > 114 || req.ayah() < 1 || req.ayah() > 286) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid ayah");
        }
        User me = currentUser.get();
        Khawatir saved = khawatirRepository.save(Khawatir.builder()
                .user(me).surahNumber(req.surah()).ayahNumber(req.ayah()).content(content).build());
        return toDto(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        User me = currentUser.get();
        Khawatir k = khawatirRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Introuvable"));
        if (!k.getUser().getId().equals(me.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }
        khawatirRepository.delete(k);
        return ResponseEntity.noContent().build();
    }

    private KhatiraDto toDto(Khawatir k) {
        return new KhatiraDto(k.getId(), k.getSurahNumber(), k.getAyahNumber(), k.getContent(), k.getCreatedAt());
    }
}