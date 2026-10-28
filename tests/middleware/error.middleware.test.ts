/*
 * This is free and unencumbered software released into the public domain.
 * Copyright (c) 2026 Les Krabe Labs.
 * For more information, please refer to <https://unlicense.org>
 */

import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import { errorMiddleware } from "../../src/middleware/error.middleware";
import { NotFoundError } from "../../src/middleware/error.middleware";
import enTranslation from "../../src/locales/en/translation.json";
import { t } from "../../src/locales/i18n";

const errorCodes = (
    enTranslation.errors as typeof enTranslation.errors & {
        codes?: {
            resource_not_found?: string;
            internal_server_error?: string;
        };
    }
).codes;

describe("Global Error Middleware", () => {
    let app: express.Application;

    afterEach(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        app = express();
        app.use(express.json());
    });

    it("should use localized message and error code for a not-found error", async () => {
        app.get("/test-error", (_req: Request, _res: Response, next: NextFunction) => {
            next(new NotFoundError());
        });

        app.use(errorMiddleware);

        const response = await request(app).get("/test-error");

        expect(errorCodes?.resource_not_found).toBe("RESOURCE_NOT_FOUND");
        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            success: false,
            error: {
                message: t("errors.not_found"),
                code: errorCodes?.resource_not_found,
            },
        });
    });

    it("should use localized message and error code for an unexpected error", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        app.get("/test-crash", (_req: Request, _res: Response, next: NextFunction) => {
            next(new Error("Database connection disconnected unexpectedly"));
        });

        app.use(errorMiddleware);
        const response = await request(app).get("/test-crash");

        expect(errorCodes?.internal_server_error).toBe("INTERNAL_SERVER_ERROR");
        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            success: false,
            error: {
                message: t("errors.internal_server_error"),
                code: errorCodes?.internal_server_error,
            },
        });
        expect(consoleSpy).toHaveBeenCalled();
    });
});