package com.photfolio.backend.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {

  @Value("${jwt.secret:mySecretKeyForPhotfolioApplicationThatIsAtLeast32CharactersLong}")
  private String jwtSecret;

  @Value("${jwt.expiration:86400000}") // 24 hours
  private int jwtExpirationMs;

  public String generateToken(String email, long sessionVersion) {
    return generateToken(email, sessionVersion, jwtExpirationMs);
  }

  public String generateToken(String email, long sessionVersion, long ttlMillis) {
    SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
    long effectiveTtl = Math.max(1_000L, ttlMillis);
    return Jwts.builder()
        .setSubject(email)
        .claim("sv", sessionVersion)
        .setIssuedAt(new Date())
        .setExpiration(new Date(System.currentTimeMillis() + effectiveTtl))
        .signWith(key, SignatureAlgorithm.HS512)
        .compact();
  }

  public String generateToken(String email) {
    return generateToken(email, 0L);
  }

  public String getEmailFromToken(String token) {
    SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
    return Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token)
        .getBody()
        .getSubject();
  }

  public boolean validateToken(String token) {
    try {
      SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
      Jwts.parserBuilder()
          .setSigningKey(key)
          .build()
          .parseClaimsJws(token);
      return true;
    } catch (Exception e) {
      return false;
    }
  }

  public long getSessionVersionFromToken(String token) {
    SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
    Object value = Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token)
        .getBody()
        .get("sv");

    if (value instanceof Number) {
      return ((Number) value).longValue();
    }

    return 0L;
  }
}
