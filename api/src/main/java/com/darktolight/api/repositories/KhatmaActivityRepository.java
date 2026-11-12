package com.darktolight.api.repositories;

import com.darktolight.api.models.KhatmaActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KhatmaActivityRepository extends JpaRepository<KhatmaActivity, Long> {
    List<KhatmaActivity> findTop30ByKhatmaIdOrderByCreatedAtDesc(Long khatmaId);
    void deleteByKhatmaId(Long khatmaId);
}