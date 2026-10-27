/*
 * This is free and unencumbered software released into the public domain.
 * Copyright (c) 2026 Les Krabe Labs.
 * For more information, please refer to <https://unlicense.org>
 */

import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import { errorMiddleware } from "../../src/middleware/error.middleware";
import { NotFoundError } from "../../src/middleware/error.middleware";

describe("Global Error Middleware", () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
    });

    it("should capture a custom operational AppError and return the uniform error shape", async () => {
        // Create a route that throws a custom operational AppError
        app.get("/test-error", (_req: Request, _res: Response, next: NextFunction) => {
            next(new NotFoundError("The requested user profile was not found"));
        });

        // Use the error middleware
        app.use(errorMiddleware);

        const response = await request(app).get("/test-error");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            error: {
                message: "The requested user profile was not found",
                code: 'RESOURCE_NOT_FOUND',
            },
        });
    });

    it("should capture an unhandled native Error, log it, and obscure it with a generic 500 fallback", async () => {
        // Spy on console.error to prevent polluting test logs
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Create a route that throws a native Error
        app.get("/test-crash", (_req: Request, _res: Response, next: NextFunction) => {
            next(new Error("Database connection disconnected unexpectedly"));
        });

        // Use the error middleware
        app.use(errorMiddleware);
        const response = await request(app).get("/test-crash");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            success: false,
            error: {
                message: "An unexpected internal server error occurred. Please try again later.",
                code: 'INTERNAL_SERVER_ERROR',
            },
        });

        // Ensure that the original error was logged
        expect(consoleSpy).toHaveBeenCalled();

        // Restore the original console.error method
        consoleSpy.mockRestore();
    });
});