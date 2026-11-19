// 생성 요청의 멱등 키를 계정별로 저장해, 같은 키로 다시 온 요청에는 처음 만든 결과를 돌려주고 다른 내용이면 409로 막는다(Q-13, PR-07 3단계).
package kr.timebar.diary.common;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.regex.Pattern;

@Component
public class IdempotencyKeys {
    public static final String HEADER = "Idempotency-Key";
    /** 로컬 자료 이전 키(local:task:3)와 재전송 키(UUID v4)를 모두 받는다. */
    private static final Pattern KEY = Pattern.compile("[A-Za-z0-9:_.-]{1,100}");
    private static final int RETENTION_DAYS = 7;

    private final JdbcTemplate jdbc;
    private final ObjectMapper canonical;

    public IdempotencyKeys(JdbcTemplate jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        // 같은 내용이면 필드 순서와 관계없이 같은 해시가 나오게 한다
        this.canonical = mapper.copy().configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true);
    }

    /**
     * 호출하는 서비스의 트랜잭션 안에서 실행한다. key가 없으면 create를 그대로 실행한다.
     * 이미 처리한 키면 처음 만든 기록을 replay로 다시 읽어 돌려준다(지워졌으면 replay가 404를 던진다).
     * 같은 키를 동시에 처리하면 늦은 쪽은 기본 키 충돌로 409가 되고 그 트랜잭션의 생성도 되돌린다.
     */
    public <T> T create(String owner, String key, Object request, Supplier<T> create, Function<T, String> idOf, Function<String, T> replay) {
        return apply(owner, key, request, 201, create, idOf, replay);
    }

    /**
     * 생성이 아닌 변경(수정)에도 같은 규칙을 쓴다. 응답을 잃어 같은 키로 다시 보낸 수정은 version 충돌(409) 대신 처음 결과의 기록을 돌려준다(PR-12 오프라인 재전송).
     * 처음 요청이 실패했으면 키가 남지 않으므로 다시 보내면 그때 다시 검사한다.
     */
    public <T> T apply(String owner, String key, Object request, int statusCode, Supplier<T> create, Function<T, String> idOf, Function<String, T> replay) {
        if (key == null) return create.get();
        if (!KEY.matcher(key).matches()) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "Idempotency-Key는 영문·숫자와 : _ . - 로 1~100자여야 합니다.");
        }
        String hash = hash(request);
        List<String[]> found = jdbc.query("SELECT request_hash, resource_id FROM idempotency_key WHERE owner_id=? AND idem_key=?",
                (rs, row) -> new String[]{rs.getString(1), rs.getString(2)}, owner, key);
        if (!found.isEmpty()) {
            if (!found.get(0)[0].equals(hash)) throw new ApiException(ErrorCode.CONFLICT, "같은 요청 키로 다른 내용을 보냈습니다.");
            return replay.apply(found.get(0)[1]);
        }
        T created = create.get();
        try {
            jdbc.update("INSERT INTO idempotency_key(owner_id, idem_key, request_hash, status_code, resource_id, created_at) VALUES (?,?,?,?,?,?)",
                    owner, key, hash, statusCode, idOf.apply(created), Timestamp.from(Instant.now()));
        } catch (DuplicateKeyException e) {
            throw new ApiException(ErrorCode.CONFLICT, "같은 요청을 처리하는 중입니다. 잠시 후 다시 시도해주세요.");
        }
        return created;
    }

    /** 보관 기간(7일)이 지난 키를 하루 한 번 지운다. */
    @Scheduled(cron = "0 30 4 * * *")
    public int purgeExpired() {
        return jdbc.update("DELETE FROM idempotency_key WHERE created_at < ?", Timestamp.from(Instant.now().minus(RETENTION_DAYS, ChronoUnit.DAYS)));
    }

    private String hash(Object request) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(canonical.writeValueAsString(request).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (JsonProcessingException | NoSuchAlgorithmException e) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "요청 본문을 확인할 수 없습니다.");
        }
    }
}
