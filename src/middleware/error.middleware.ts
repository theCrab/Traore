/*
 * This is free and unencumbered software released into the public domain.
 * Copyright (c) 2026 Les Krabe Labs.
 * For more information, please refer to <https://unlicense.org>
 */

import { Request, Response, ErrorRequestHandler, NextFunction } from "express";

/**
 * Custom operational error base interface and implementation
 */
export interface IAppError extends Error {
    statusCode: number;
    code: string;
}

/**
 * An expected HTTP error safe to return to an API client.
 */
export class AppError extends Error implements IAppError {
    /**
     * Creates an application error with an HTTP status and stable error code.
     * @param message - The client-safe error message.
     * @param statusCode - The HTTP status code for the response.
     * @param code - The machine-readable error code.
     */
    constructor(
        public override readonly message: string, 
        public readonly statusCode: number, 
        public readonly code: string
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype); // Restore prototype chain
    }
}

/**
 * Concrete Core Structural Operational Errors
 * Represents a resource lookup that did not find a matching resource.
 */
export class NotFoundError extends AppError {
    /**
     * Creates a not-found error.
     * @param message - The client-safe explanation of the missing resource.
     */
    constructor(message: string = "Resource not found.") {
        super(message, 404, "RESOURCE_NOT_FOUND");
    }
}

export class ValidationError extends AppError {
    constructor(message: string = "Invalid input provided.") {
        super(message, 400, "VALIDATION_FAILED");
    }
}

/**
 * Unchanging uniform Error API Format Interface.
 */
export interface IApiErrorResponse {
    success: boolean;
    error: {
        message: string;
        code: string;
    };
}

/**
 * Global Error interceptor middleware.
 * Returns expected application errors to clients and hides unexpected details.
 */
export const errorMiddleware: ErrorRequestHandler = (
    err: Error | AppError,
    _request: Request,
    response: Response,
    _next: NextFunction
): void => {
    // 1. Handle Checked Operational Framework Errors
    if (err instanceof AppError) {
        const apiErrorResponse: IApiErrorResponse = {
            success: false,
            error: {
                message: err.message,
                code: err.code
            }
        };
        response.status(err.statusCode).json(apiErrorResponse);
        return; 
    }

    // 2. Handle Uncaught Raw System Crashes (Do not leak system memory logs or stack traces to clients)
    console.error('[Fatal System Exception]:', err); // Log the error for internal debugging

    const serverErrorResponse: IApiErrorResponse = {
        success: false,
        error: {
            message: "An unexpected internal server error occurred. Please try again later.",
            code: "INTERNAL_SERVER_ERROR"
        }
    };
    response.status(500).json(serverErrorResponse);
    return;
}