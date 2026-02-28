package com.photfolio.backend.config;

import com.photfolio.backend.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Autowired
  private CustomUserDetailsService userDetailsService;

  @Autowired
  private JwtAuthenticationFilter jwtAuthenticationFilter;

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public DaoAuthenticationProvider authenticationProvider() {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
    provider.setUserDetailsService(userDetailsService);
    provider.setPasswordEncoder(passwordEncoder());
    return provider;
  }

  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
    return config.getAuthenticationManager();
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authenticationProvider(authenticationProvider())
        .authorizeHttpRequests(auth -> auth
          .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/verify-login-otp", "/api/auth/register", "/api/auth/request-access", "/api/auth/request-access-existing", "/api/auth/forgot-password", "/api/auth/forgot-password-otp", "/api/auth/reset-password", "/api/auth/reset-password-otp", "/api/auth/send-registration-otp", "/api/auth/verify-registration-otp", "/api/auth/set-registration-password", "/api/contact/query").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/gallery/**").permitAll()
          .requestMatchers(HttpMethod.GET, "/api/content/about").permitAll()
          .requestMatchers(HttpMethod.GET, "/api/content/contact").permitAll()
          .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
            .anyRequest().authenticated()
        );

      http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOriginPatterns(Arrays.asList(
        "http://localhost:*",
      "http://127.0.0.1:*",
      "http://192.168.*:*",
      "http://10.*:*",
      "http://172.16.*:*",
      "http://172.17.*:*",
      "http://172.18.*:*",
      "http://172.19.*:*",
      "http://172.20.*:*",
      "http://172.21.*:*",
      "http://172.22.*:*",
      "http://172.23.*:*",
      "http://172.24.*:*",
      "http://172.25.*:*",
      "http://172.26.*:*",
      "http://172.27.*:*",
      "http://172.28.*:*",
      "http://172.29.*:*",
      "http://172.30.*:*",
      "http://172.31.*:*"
    ));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }
}
