// 채팅 설정과 관계없이 멱등 키 정리 같은 정기 작업을 실행한다(PR-07 3단계). 채팅 정기 작업은 각자 조건부 빈이다.
package kr.timebar.diary.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class SchedulingConfig {
}
