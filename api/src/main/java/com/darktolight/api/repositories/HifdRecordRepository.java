package com.darktolight.api.repositories;

import com.darktolight.api.models.HifdRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HifdRecordRepository extends JpaRepository<HifdRecord, Long> {
    Optional<HifdRecord> findByUserIdAndSurahNumberAndAyahNumber(Long userId, Integer surahNumber, Integer ayahNumber);
    List<HifdRecord> findByUserIdOrderBySurahNumberAscAyahNumberAsc(Long userId);
    List<HifdRecord> findByUserIdAndSurahNumber(Long userId, Integer surahNumber);
}