/*
 * This is free and unencumbered software released into the public domain.
 * Copyright (c) 2026 Les Krabe Labs.
 * For more information, please refer to <https://unlicense.org>
 */

import { Request, Response, ErrorRequestHandler, NextFunction } from "express";
import { t, TranslationKeys } from "../locales/i18n";

/**
 * Resolves a safe locale identifier from the request's Accept-Language header.
 * @param request - Incoming request providing optional language preferences.
 * @returns A two-letter locale identifier, defaulting to English.
 */
function getRequestLocale(request: Request): string {
    const languagePreference = request.get("Accept-Language")?.split(",")[0]?.trim();
    const language = languagePreference?.split("-")[0];

    return language && /^[a-z]{2}$/i.test(language) ? language.toLowerCase() : "en";
}

/**
 * Structural contract for expected HTTP errors safe to return to API clients.
 */
export interface IAppError extends Error {
    /** HTTP status code to send to the API client. */
    statusCode: number;
    /** Stable machine-readable error identifier. */
    code: string;
    /** Optional key used to resolve the client message for the request locale. */
    messageKey?: TranslationKeys;
}

/**
 * An expected HTTP error safe to return to an API client.
 */
export class AppError extends Error implements IAppError {
    /**
     * Creates an application error with an HTTP status and stable error code.
     * @param message - The default client-safe error message.
     * @param statusCode - The HTTP status code for the response.
     * @param code - The machine-readable error code.
     * @param messageKey - Optional localization key for request-scoped rendering.
     */
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly code: string,
        public readonly messageKey?: TranslationKeys
    ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = new.target.name;
    }
}

/**
 * Represents a resource lookup that did not find a matching resource.
 */
export class NotFoundError extends AppError {
    /**
     * Creates a localized not-found error.
     * @param message - Optional client-safe explanation overriding the default.
     */
    constructor(message?: string) {
        super(
            message ?? t("errors.not_found"),
            404,
            t("errors.codes.resource_not_found"),
            message === undefined ? "errors.not_found" : undefined
        );
    }
}

/**
 * Represents invalid request input.
 */
export class ValidationError extends AppError {
    /**
     * Creates a localized validation error.
     * @param message - Optional client-safe explanation overriding the default.
     */
    constructor(message?: string) {
        super(
            message ?? t("errors.invalid_input"),
            400,
            t("errors.codes.validation_failed"),
            message === undefined ? "errors.invalid_input" : undefined
        );
    }
}

/**
 * The standardized JSON response shape for API errors.
 */
export interface IApiErrorResponse {
    /** Indicates that the API operation failed. */
    success: false;
    /** Client-safe error details and stable machine-readable code. */
    error: {
        /** Localized description of the failure. */
        message: string;
        /** Stable identifier for the failure category. */
        code: string;
    };
}

/**
 * Global Error interceptor middleware.
 * Returns expected application errors to clients and hides unexpected details.
 * @param err - The error passed through Express middleware.
 * @param request - Incoming request used to determine the response locale.
 * @param response - Express response used to send the API error.
 * @param next - Express continuation for errors after headers are sent.
 */
export const errorMiddleware: ErrorRequestHandler = (
    err: Error | IAppError,
    request: Request,
    response: Response,
    next: NextFunction
): void => {
    if (response.headersSent) {
        next(err);
        return;
    }

    const locale = getRequestLocale(request);

    if (err instanceof AppError) {
        const apiErrorResponse: IApiErrorResponse = {
            success: false,
            error: {
                message: err.messageKey ? t(err.messageKey, locale) : err.message,
                code: err.code
            }
        };
        response.status(err.statusCode).json(apiErrorResponse);
        return;
    }

    console.error(err);

    const serverErrorResponse: IApiErrorResponse = {
        success: false,
        error: {
            message: t("errors.internal_server_error", locale),
            code: t("errors.codes.internal_server_error", locale)
        }
    };
    response.status(500).json(serverErrorResponse);
    return;
}