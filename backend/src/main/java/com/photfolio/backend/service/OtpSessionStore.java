package com.photfolio.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpSessionStore {

  private final Map<String, Map<String, String>> memoryStore = new ConcurrentHashMap<>();

  @Autowired(required = false)
  private StringRedisTemplate redisTemplate;

  @Value("${app.otp.store:memory}")
  private String configuredStore;

  public void put(String key, Map<String, String> values, Duration ttl) {
    if (redisEnabled()) {
      redisTemplate.opsForHash().putAll(key, values);
      redisTemplate.expire(key, ttl);
      return;
    }
    memoryStore.put(key, new HashMap<>(values));
  }

  public Map<String, String> get(String key) {
    if (redisEnabled()) {
      Map<Object, Object> values = redisTemplate.opsForHash().entries(key);
      Map<String, String> result = new HashMap<>();
      values.forEach((field, value) -> result.put(String.valueOf(field), String.valueOf(value)));
      return result;
    }
    return memoryStore.getOrDefault(key, Map.of());
  }

  public void delete(String key) {
    if (redisEnabled()) {
      redisTemplate.delete(key);
      return;
    }
    memoryStore.remove(key);
  }

  private boolean redisEnabled() {
    return "redis".equalsIgnoreCase(configuredStore) && redisTemplate != null;
  }
}