package com.darktolight.api.controllers;

import com.darktolight.api.services.QuranService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/quran")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class QuranController {

    private final QuranService quranService;

    @GetMapping("/surahs")
    public ResponseEntity<List<Object>> getAllSurahs() {
        return ResponseEntity.ok(quranService.getAllSurahs());
    }

    @GetMapping("/surah/{surahNumber}/audio/{audioEdition}")
    public ResponseEntity<Object> getSurahWithAudio(
            @PathVariable int surahNumber,
            @PathVariable String audioEdition) {
        return ResponseEntity.ok(quranService.getSurahWithAudio(surahNumber, audioEdition));
    }

    @GetMapping("/surah/{surahNumber}/tafsir/{tafsirEdition}")
    public ResponseEntity<Object> getSurahWithTafsir(
            @PathVariable int surahNumber,
            @PathVariable String tafsirEdition) {
        return ResponseEntity.ok(quranService.getSurahWithTafsir(surahNumber, tafsirEdition));
    }

    @GetMapping("/ayah/{surahNumber}/{ayahNumber}")
    public ResponseEntity<Object> getSpecificAyah(
            @PathVariable int surahNumber,
            @PathVariable int ayahNumber,
            @RequestParam(defaultValue = "ar.alafasy") String edition) {
        return ResponseEntity.ok(quranService.getSpecificAyah(surahNumber, ayahNumber, edition));
    }

    @GetMapping("/ayah/{surahNumber}/{ayahNumber}/words")
    public ResponseEntity<Object> getAyahWordByWord(
            @PathVariable int surahNumber,
            @PathVariable int ayahNumber,
            @RequestParam(defaultValue = "en") String language) {
        return ResponseEntity.ok(quranService.getAyahWordByWord(surahNumber, ayahNumber, language));
    }

    // Aya wa7da b ktar mn edition (ex: fr.hamidullah,en.sahih,ar.jalalayn)
    @GetMapping("/ayah/{surahNumber}/{ayahNumber}/editions/{editions}")
    public ResponseEntity<Object> getAyahEditions(
            @PathVariable int surahNumber,
            @PathVariable int ayahNumber,
            @PathVariable String editions) {
        if (surahNumber < 1 || surahNumber > 114 || ayahNumber < 1 || ayahNumber > 286) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return ResponseEntity.ok(quranService.getAyahEditions(surahNumber, ayahNumber, editions));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Les editions text: type = tafsir | translation
    @GetMapping("/editions/{type}")
    public ResponseEntity<Object> getEditions(@PathVariable String type) {
        return ResponseEntity.ok(quranService.getEditions(type));
    }

    // Ga3 l-9orra2 disponibles (aya b aya) + template dyal l-URL audio
    @GetMapping("/reciters/audio")
    public ResponseEntity<List<Map<String, Object>>> getAudioReciters() {
        return ResponseEntity.ok(quranService.getAudioReciters());
    }

    @GetMapping("/search")
    public ResponseEntity<Object> searchQuran(@RequestParam String q) {
        return ResponseEntity.ok(quranService.searchQuran(q));
    }

    @GetMapping("/reciters")
    public ResponseEntity<Object> getReciters() {
        return ResponseEntity.ok(quranService.getPopularReciters());
    }

    @GetMapping("/ayah/random")
    public ResponseEntity<Object> getRandomAyah() {
        return ResponseEntity.ok(quranService.getRandomAyah());
    }
}