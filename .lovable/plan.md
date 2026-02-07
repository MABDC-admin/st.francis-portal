

# Update Omada Controller Credentials

## Current Status
The Omada proxy edge function is deployed and reachable. The controller is configured (`OMADA_URL` is set), but the current `OMADA_CLIENT_ID` and `OMADA_CLIENT_SECRET` values are outdated, causing an authentication error: **"The Client Id Or Client Secret is Invalid."**

## Steps

1. **Update `OMADA_CLIENT_ID` secret** to `889aad07694f437087890b70c5fd1806`
2. **Update `OMADA_CLIENT_SECRET` secret** to `fb32591a98e54dbfb6269a2ca384f958`
3. **Re-test the connection** by calling the `omada-proxy` edge function with the `status` action to confirm it returns `healthy: true`
4. **Test fetching sites** by calling the `proxy` action with `/openapi/v1/sites` to verify full API access

No code changes are required -- only the stored secret values need updating.

