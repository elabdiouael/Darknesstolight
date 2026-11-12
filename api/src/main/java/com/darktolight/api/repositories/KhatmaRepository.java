package com.darktolight.api.repositories;

import com.darktolight.api.models.Khatma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KhatmaRepository extends JpaRepository<Khatma, Long> {
    List<Khatma> findByUserIdOrderByLastReadAtDesc(Long userId);
    Optional<Khatma> findByIdAndUserId(Long khatmaId, Long userId);
    Optional<Khatma> findByInviteCode(String inviteCode);

    // Ga3 l-khatmat li ana owner fihom awla member
    @Query("select distinct k from Khatma k left join k.members m " +
            "where k.user.id = :userId or m.id = :userId order by k.lastReadAt desc")
    List<Khatma> findAccessible(@Param("userId") Long userId);
}