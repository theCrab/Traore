# Traore
A Nodejs Express authentication system that uses OTP only.

## Error handling

Register `globalErrorMiddleware` after routes so errors passed to Express with
`next(error)` use the standard `{ success: false, error: { message, code } }`
response shape. Throw or forward `AppError` for expected HTTP failures; Zod
errors are returned as `400 VALIDATION_ERROR`, and unexpected errors receive a
generic `500 INTERNAL_SERVER_ERROR` response without exposing internal details.
Errors raised after response headers are sent are forwarded to Express's
remaining error handlers.

```typescript
import { globalErrorMiddleware } from './middleware/error.middleware';

app.use(globalErrorMiddleware);
```

Run the middleware test suite with `npm test` and type-check/build source with
`npm run build`.
