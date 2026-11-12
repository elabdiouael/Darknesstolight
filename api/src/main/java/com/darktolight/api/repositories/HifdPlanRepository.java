package com.darktolight.api.repositories;

import com.darktolight.api.models.HifdPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HifdPlanRepository extends JpaRepository<HifdPlan, Long> {
    Optional<HifdPlan> findByUserId(Long userId);
}