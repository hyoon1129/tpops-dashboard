package com.shinhan.tpops.serverinfo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ServerInfoInitializer implements CommandLineRunner {

	private final ServerInfoService serverInfoService;

	@Override
	public void run(String... args) {
		log.info("ServerInfoInitializer 실행 중...");
		if (serverInfoService.findAll().isEmpty()) {
			serverInfoService.create(new ServerInfoCreateRequest("기본 서버", null, null, null));
			log.info("기본 서버가 생성되었습니다.");
		} else {
			log.info("이미 서버가 등록되어 있습니다. 건너뜁니다.");
		}
	}
}
