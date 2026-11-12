package com.darktolight.api.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuranService {

    private final RestClient restClient;
    private static final String ALQURAN_CLOUD_BASE_URL = "https://api.alquran.cloud/v1";
    private static final String QURAN_COM_V4_BASE_URL = "https://api.quran.com/api/v4";
    /** Identifiers dyal les editions (ex: ar.alafasy, fr.hamidullah) — bach ma ndkhlouch ay haja f l-URL */
    private static final Pattern EDITIONS = Pattern.compile("^[a-z0-9._-]+(,[a-z0-9._-]+){0,5}$");
    private static final Pattern LANGUAGE = Pattern.compile("^[a-z]{2,3}$");

    @Cacheable(value = "quranCache", key = "'surahList'")
    @SuppressWarnings("unchecked")
    public List<Object> getAllSurahs() {
        log.info("Fetching all surahs from Al Quran Cloud API");
        Map<String, Object> response = restClient.get()
                .uri(ALQURAN_CLOUD_BASE_URL + "/surah")
                .retrieve()
                .body(Map.class);

        if (response != null && response.get("data") instanceof List) {
            return (List<Object>) response.get("data");
        }
        return Collections.emptyList();
    }

    @Cacheable(value = "quranCache", key = "'surah_' + #surahNumber + '_audio_' + #audioEdition")
    public Object getSurahWithAudio(int surahNumber, String audioEdition) {
        log.info("Fetching surah {} with audio {}", surahNumber, audioEdition);
        String endpoint = ALQURAN_CLOUD_BASE_URL + "/surah/" + surahNumber + "/" + audioEdition;
        return restClient.get()
                .uri(endpoint)
                .retrieve()
                .body(Object.class);
    }

    @Cacheable(value = "quranCache", key = "'surah_' + #surahNumber + '_tafsir_' + #tafsirEdition")
    public Object getSurahWithTafsir(int surahNumber, String tafsirEdition) {
        log.info("Fetching surah {} with tafsir {}", surahNumber, tafsirEdition);
        String endpoint = ALQURAN_CLOUD_BASE_URL + "/surah/" + surahNumber + "/" + tafsirEdition;
        return restClient.get()
                .uri(endpoint)
                .retrieve()
                .body(Object.class);
    }

    @Cacheable(value = "quranCache", key = "'ayah_' + #surahNumber + '_' + #ayahNumber + '_' + #edition")
    public Object getSpecificAyah(int surahNumber, int ayahNumber, String edition) {
        String endpoint = ALQURAN_CLOUD_BASE_URL + "/ayah/" + surahNumber + ":" + ayahNumber + "/" + edition;
        return restClient.get()
                .uri(endpoint)
                .retrieve()
                .body(Object.class);
    }

    @Cacheable(value = "quranCache", key = "'words2_' + #surahNumber + '_' + #ayahNumber + '_' + #language")
    public Object getAyahWordByWord(int surahNumber, int ayahNumber, String language) {
        String lang = language != null && LANGUAGE.matcher(language).matches() ? language : "en";
        String verseKey = surahNumber + ":" + ayahNumber;
        String endpoint = QURAN_COM_V4_BASE_URL + "/verses/by_key/" + verseKey
                // audio=7 (Mishary Alafasy): url dyal l-aya + segments [kelma, debut ms, fin ms] -> lecture synchronisée
                + "?words=true&word_fields=text_uthmani,transliteration,position&audio=7&language=" + lang;
        return restClient.get()
                .uri(endpoint)
                .retrieve()
                .body(Object.class);
    }

    public Object searchQuran(String keyword) {
        String endpoint = ALQURAN_CLOUD_BASE_URL + "/search/" + keyword + "/all/en.sahih";
        return restClient.get()
                .uri(endpoint)
                .retrieve()
                .body(Object.class);
    }

    public Object getRandomAyah() {
        return restClient.get()
                .uri(ALQURAN_CLOUD_BASE_URL + "/ayah/random/ar.alafasy")
                .retrieve()
                .body(Object.class);
    }

    @Cacheable(value = "quranCache", key = "'recitersList'")
    public Object getPopularReciters() {
        String endpoint = ALQURAN_CLOUD_BASE_URL + "/edition?format=audio&language=ar&type=versebyverse";
        return restClient.get()
                .uri(endpoint)
                .retrieve()
                .body(Object.class);
    }

    /**
     * Ga3 l-9orra2 (audio aya b aya) li kaynin f alquran.cloud, m3a template dyal l-URL dyal l-audio.
     * Kan-jebdo l-URL dyal aya 1 l kol 9ari2 (bach n3erfo l-bitrate li kayn f l-CDN), w kan-7ottou "{n}" blast ra9m l-aya.
     * Résultat: [{ id, name, englishName, language, url: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/{n}.mp3" }]
     */
    @Cacheable(value = "quranCache", key = "'audioReciters_v1'", unless = "#result == null || #result.isEmpty()")
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getAudioReciters() {
        Map<String, Object> response = restClient.get()
                .uri(ALQURAN_CLOUD_BASE_URL + "/edition?format=audio&type=versebyverse")
                .retrieve()
                .body(Map.class);
        if (response == null || !(response.get("data") instanceof List)) return Collections.emptyList();

        List<Map<String, Object>> editions = (List<Map<String, Object>>) response.get("data");
        List<Map<String, Object>> out = editions.parallelStream().map(e -> {
            String id = String.valueOf(e.get("identifier"));
            try {
                Map<String, Object> ayah = restClient.get()
                        .uri(ALQURAN_CLOUD_BASE_URL + "/ayah/1/" + id)
                        .retrieve()
                        .body(Map.class);
                Object data = ayah != null ? ayah.get("data") : null;
                String audio = data instanceof Map<?, ?> m && m.get("audio") != null ? String.valueOf(m.get("audio")) : null;
                if (audio == null || !audio.endsWith("/1.mp3")) return null;
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("id", id);
                r.put("name", e.get("name"));
                r.put("englishName", e.get("englishName"));
                r.put("language", e.get("language"));
                r.put("url", audio.substring(0, audio.length() - "1.mp3".length()) + "{n}.mp3");
                return r;
            } catch (Exception ex) {
                log.warn("Reciter {} skipped: {}", id, ex.getMessage());
                return null;
            }
        }).filter(Objects::nonNull).collect(java.util.stream.Collectors.toCollection(ArrayList::new));

        // L-3arbiya l-wla, mn be3d b smiya
        out.sort(Comparator.comparing((Map<String, Object> r) -> "ar".equals(r.get("language")) ? 0 : 1)
                .thenComparing(r -> String.valueOf(r.get("englishName"))));
        return out;
    }

    /** Les editions dyal type mo3ayan: "tafsir" awla "translation" */
    @Cacheable(value = "quranCache", key = "'editions_' + #type")
    public Object getEditions(String type) {
        String t = "tafsir".equals(type) ? "tafsir" : "translation";
        return restClient.get()
                .uri(ALQURAN_CLOUD_BASE_URL + "/edition?format=text&type=" + t)
                .retrieve()
                .body(Object.class);
    }

    /** Aya wa7da b ktar mn edition (traductions / tafasir) f merra wa7da */
    @Cacheable(value = "quranCache", key = "'ayahEditions_' + #surahNumber + '_' + #ayahNumber + '_' + #editions")
    public Object getAyahEditions(int surahNumber, int ayahNumber, String editions) {
        if (editions == null || !EDITIONS.matcher(editions).matches()) {
            throw new IllegalArgumentException("Invalid editions");
        }
        return restClient.get()
                .uri(ALQURAN_CLOUD_BASE_URL + "/ayah/" + surahNumber + ":" + ayahNumber + "/editions/" + editions)
                .retrieve()
                .body(Object.class);
    }
}