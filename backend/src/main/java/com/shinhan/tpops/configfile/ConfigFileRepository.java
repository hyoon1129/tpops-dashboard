package com.shinhan.tpops.configfile;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfigFileRepository extends JpaRepository<ConfigFile, Long> {

	Optional<ConfigFile> findByServerInfoIdAndCurrentTrue(Long serverId);

	Optional<ConfigFile> findTopByServerInfoIdOrderByVersionNoDesc(Long serverId);
}
