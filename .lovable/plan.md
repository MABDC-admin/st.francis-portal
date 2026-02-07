

# Update Omada URL to HTTP

## Problem
The current `OMADA_URL` secret is set to `https://128.140.99.247:8043`, which fails because the edge function runtime rejects the self-signed certificate.

## Solution
Update the `OMADA_URL` secret to `http://128.140.99.247:8088` (HTTP on port 8088). This bypasses the TLS issue entirely.

## Steps
1. Update the `OMADA_URL` secret value from `https://128.140.99.247:8043` to `http://128.140.99.247:8088`
2. Test the `omada-proxy` edge function to verify connectivity
3. No code changes needed

