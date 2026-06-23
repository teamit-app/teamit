package com.teamit.server.global.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expiry}")
    private long accessTokenExpiry;

    @Value("${jwt.refresh-token-expiry}")
    private long refreshTokenExpiry;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(Long userId) {
        return buildToken(userId, accessTokenExpiry);
    }

    public String createRefreshToken(Long userId) {
        return buildToken(userId, refreshTokenExpiry);
    }

    private String buildToken(Long userId, long expiry) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiry))
                .signWith(getKey())
                .compact();
    }

    public Long getUserId(String token) {
        return Long.parseLong(parseClaims(token).getSubject());
    }

    public boolean validate(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
