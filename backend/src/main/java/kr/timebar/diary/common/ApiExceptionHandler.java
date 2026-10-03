package kr.timebar.diary.common;

import jakarta.persistence.LockTimeoutException;
import jakarta.persistence.OptimisticLockException;
import jakarta.persistence.PessimisticLockException;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleApiException(ApiException e) {
        return ResponseEntity.status(e.errorCode().status()).body(new ApiResponse<>(false, null, e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return ResponseEntity.status(ErrorCode.VALIDATION_FAILED.status())
                .body(new ApiResponse<>(false, null, message.isBlank() ? ErrorCode.VALIDATION_FAILED.defaultMessage() : message));
    }

    @ExceptionHandler({IllegalArgumentException.class, NoSuchElementException.class})
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(RuntimeException e) {
        return ResponseEntity.badRequest().body(new ApiResponse<>(false, null, e.getMessage()));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class, ConstraintViolationException.class,
            HandlerMethodValidationException.class})
    public ResponseEntity<ApiResponse<Void>> handleInvalidInput(Exception exception) {
        return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, null, ErrorCode.VALIDATION_FAILED.defaultMessage()));
    }

    @ExceptionHandler({ConcurrencyFailureException.class, OptimisticLockException.class,
            PessimisticLockException.class, LockTimeoutException.class})
    public ResponseEntity<ApiResponse<Void>> handleConcurrentModification(RuntimeException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(false, null, "다른 요청에서 변경되었습니다. 다시 조회해주세요."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception e) {
        if (e instanceof ErrorResponse errorResponse) {
            return ResponseEntity.status(errorResponse.getStatusCode())
                    .body(new ApiResponse<>(false, null, "요청을 처리할 수 없습니다."));
        }
        // Exception type and stack locations identify failures without recording SQL or request secrets.
        LOGGER.error("Unhandled API failure: type={}, stack={}", e.getClass().getName(), e.getStackTrace());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(false, null, ErrorCode.INTERNAL_ERROR.defaultMessage()));
    }
}
