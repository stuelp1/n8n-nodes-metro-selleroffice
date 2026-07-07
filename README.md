# n8n-nodes-metro-selleroffice

n8n community node for the [METRO Markets Seller Office REST API](https://developer.metro-selleroffice.com/docs/rest-api/).

This is an n8n community node. It lets you use METRO Markets in your n8n workflows.

## Installation

Follow the [n8n community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/), or for local development:

```bash
npm install
npm run build
npm link
# in your n8n installation
npm link n8n-nodes-metro-selleroffice
```

## Credentials

Create a **METRO Seller Office API** credential in n8n with:

- **Environment** — Sandbox or Production
- **Client Key** — from Seller Office
- **Client Secret** — from Seller Office (shown once, write it down)

Every request is signed with HMAC-SHA256 as documented at
https://developer.metro-selleroffice.com/docs/authentication/ — the credential's `authenticate`
function builds the `X-Client-Id`, `X-Timestamp` and `X-Signature` headers per request, so no
manual signing is needed in your workflows.

### ⚠️ Unverified assumptions

- **Production hostnames** are inferred by dropping the `.sandbox.` segment from the documented
  sandbox hosts (e.g. `app-order-management.sandbox.infra.metro-markets.cloud` →
  `app-order-management.infra.metro-markets.cloud`). METRO's docs only document the sandbox host
  names explicitly — confirm the production pattern with METRO/your account manager before
  relying on it.
- **Signing multipart uploads** (invoice/credit-note/return-label): METRO's signing spec only
  defines the body component for JSON requests ("empty string if no body"). It says nothing about
  multipart/form-data uploads, so this node signs those requests with an empty body string. Verify
  against the sandbox before uploading real documents in production.

## Supported resources / operations

Covers every REST section documented at https://developer.metro-selleroffice.com/docs/rest-api/:

| Resource | Operations |
|---|---|
| Order | Get, Get Many |
| Order Line | Confirm, Ship, Cancel, Accept Return, Decline Return, Mark Returned, Upload Invoice, Upload Credit Note, Upload Return Label |
| Offer | Create, Get Many, Delete (PriceGuard applies to Create — see note below) |
| Inventory | Update Stock |
| Category | Get, Get Many |
| Product Upload | Create, Get, Get Many, Get Error Report |
| Product List | Get Approved, Get Rejected, Get Rejected Errors, Generate/Get Latest Approved Export, Generate/Get Latest Rejected Export, Generate/Get Latest New Markets Export |
| Chat | Get Categories, Get Subjects, Check Emails Exist, Create, Get Many, Get Unseen |
| Message | Upload Attachment, Send, Get Many, Get |
| Market | Get Many Markets, Get Many Origins (Multimarkets/Crossborders) |
| Event Subscription | Create, Get Many, Update, Delete |
| Dictionary | Get Delivery Carriers, Get Cancellation Reasons, Get Return Reasons, Get Included Fees |

**PriceGuard**: METRO rejects an offer price/shipping-cost drop of 50% or more in a single
`Offer > Create` call. To apply a larger drop, delete the offer first and recreate it.

**Product Upload / Get Error Report** returns the raw CSV report text as a `csv` string field
(not parsed), since METRO returns `text/csv` rather than JSON for that endpoint.

## Compatibility

Built against `n8n-workflow` with the programmatic node style (`execute()`), tested with n8n 1.x.

## Resources

- [METRO Markets developer portal](https://developer.metro-selleroffice.com/docs/rest-api/)
- [n8n community nodes docs](https://docs.n8n.io/integrations/community-nodes/)
