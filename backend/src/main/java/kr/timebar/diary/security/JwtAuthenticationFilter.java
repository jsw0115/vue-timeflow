package kr.timebar.diary.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/** Authorization: Bearer 헤더의 액세스 토큰을 검증해 SecurityContext에 인증 정보를 채우는 stateless 필터. */
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenProvider jwtTokenProvider;
    private final kr.timebar.diary.auth.UserRepository users;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, kr.timebar.diary.auth.UserRepository users) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                Claims claims = jwtTokenProvider.parse(token);
                if ("access".equals(claims.get("typ", String.class))) {
                    String userId = claims.getSubject();
                    String email = claims.get("email", String.class);
                    String role = claims.get("role", String.class);
                    var account = users.findById(userId).orElse(null);
                    Object rawVersion = claims.get("av");
                    long version = rawVersion instanceof Number value ? value.longValue() : 0;
                    if (account == null || !account.isActive() || account.getAuthVersion() != version || !account.getRole().name().equals(role)) {
                        throw new IllegalArgumentException("폐기되었거나 비활성 계정의 토큰입니다.");
                    }
                    AuthUserPrincipal principal = new AuthUserPrincipal(userId, email, role);
                    var authentication = new UsernamePasswordAuthenticationToken(
                            principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (RuntimeException invalidToken) {
                // 유효하지 않은/만료된 토큰은 인증되지 않은 요청으로 취급한다 —
                // 보호된 엔드포인트라면 이후 AuthenticationEntryPoint가 401을 응답한다.
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
