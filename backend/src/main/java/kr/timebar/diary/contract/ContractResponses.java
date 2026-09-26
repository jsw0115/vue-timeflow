package kr.timebar.diary.contract;

import kr.timebar.diary.common.ApiResponse;
import java.util.Map;

final class ContractResponses {
    private ContractResponses() {}
    static ApiResponse<Map<String, Object>> stub(String endpoint) {
        return ApiResponse.ok(Map.of("endpoint", endpoint, "status", "CONTRACT_READY"), "컨트롤러 계약만 준비되었습니다.");
    }
}
