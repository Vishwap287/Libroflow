package com.library.portal.exception;

public class PortalNotFoundException extends RuntimeException {
    public PortalNotFoundException(String message) {
        super(message);
    }
}
