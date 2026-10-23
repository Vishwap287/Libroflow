package com.library.portal.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Exception handling scoped only to the portal module's controllers
 * (basePackages restricts this advice so it never intercepts admin
 * controller exceptions, which remain handled by the existing
 * com.library.exception.GlobalExceptionHandler).
 */
@RestControllerAdvice(basePackages = "com.library.portal.controller")
public class PortalExceptionHandler {

    @ExceptionHandler(PortalNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(PortalNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(PortalBadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(PortalBadRequestException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        StringBuilder message = new StringBuilder();
        ex.getBindingResult().getFieldErrors().forEach(err ->
                message.append(err.getField()).append(": ").append(err.getDefaultMessage()).append("; "));
        return buildResponse(HttpStatus.BAD_REQUEST, message.toString());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong: " + ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return new ResponseEntity<>(body, status);
    }
}
