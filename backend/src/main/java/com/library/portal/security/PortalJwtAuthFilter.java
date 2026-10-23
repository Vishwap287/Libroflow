package com.library.portal.security;

import com.library.portal.model.PortalUser;
import com.library.portal.repository.PortalUserRepository;
import com.library.security.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Authenticates requests carrying a JWT issued to a PORTAL user (identified
 * by email). This runs alongside the existing admin JwtAuthFilter in the
 * same filter chain; if the token's subject isn't a known portal user this
 * filter simply does nothing and lets the admin filter (or rejection) proceed.
 */
@Component
@RequiredArgsConstructor
public class PortalJwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final PortalUserRepository portalUserRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {

        // Skip if the request is already authenticated (e.g. by the admin filter)
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String jwt = authHeader.substring(7);
            String email = null;
            try {
                email = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                // not a valid token at all - let it pass through unauthenticated
            }

            if (email != null) {
                Optional<PortalUser> portalUserOpt = portalUserRepository.findByEmail(email);
                if (portalUserOpt.isPresent()) {
                    PortalUser portalUser = portalUserOpt.get();

                    UserDetails userDetails = org.springframework.security.core.userdetails.User
                            .withUsername(portalUser.getEmail())
                            .password(portalUser.getPassword())
                            .authorities(List.of(new SimpleGrantedAuthority("ROLE_USER")))
                            .build();

                    if (jwtUtil.validateToken(jwt, userDetails)) {
                        UsernamePasswordAuthenticationToken authToken =
                                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
