# Manual QA Checklist

## 1. Health Check
- [ ] Send GET to `/api/v1/health` and verify response is `{ "status": "ok" }`.

## 2. Template Listing
- [ ] Send GET to `/api/v1/templates` and verify all template types and files are listed.

## 3. Certificate Generation (Sync)
- [ ] Send POST to `/api/v1/certificates/generate` with valid data and basic auth (`admin`/`password123`).
- [ ] Verify a certificate file is generated and stored.
- [ ] Try with invalid data and verify error response.
- [ ] Try without auth and verify 401 Unauthorized.

## 4. Certificate Generation (Async)
- [ ] Send POST to `/api/v1/certificates/generate_async` with valid data.
- [ ] Verify a job ID is returned.
- [ ] Poll `/api/v1/jobs/<job_id>` and verify job status and result.

## 5. AI Personalization
- [ ] Generate a certificate with AI options and verify the personalized message is included.

## 6. Storage
- [ ] Check that generated certificates are saved in the correct directory.

## 7. API Docs
- [ ] Open `/apidocs` and verify Swagger UI loads and matches the OpenAPI spec.

## 8. Error Handling
- [ ] Trigger known errors (bad input, missing template, etc.) and verify correct error messages.

---

**Result:** Mark each test as pass/fail and note any issues found.
