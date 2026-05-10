package com.shinhan.tpops.svrgroupconfig;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SvrgroupConfigRepository extends JpaRepository<SvrgroupConfig, Long> {

	List<SvrgroupConfig> findByConfigFileId(Long fileId);
}
