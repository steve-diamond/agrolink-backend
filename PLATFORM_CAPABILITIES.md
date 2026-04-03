# DOS AGROLINK NIGERIA - Strategic Capability Blueprint

This document maps the platform vision to concrete backend capabilities and rollout priorities.

## Platform Vision

DOS AGROLINK NIGERIA is built to solve real farmer problems across Nigeria:

- sell produce directly and get fairer prices
- access trusted buyers and transparent demand
- receive digital payments and build transaction history
- access micro-loans with data-backed assessment
- move produce quickly through coordinated logistics
- reduce spoilage through structured storage
- make better decisions with practical advisory intelligence

## Capability Matrix

### 1. Smart Produce Marketplace

Status: Implemented (core)

Endpoints:

- `GET /api/v1/products`
- `POST /api/v1/products`
- `PUT /api/v1/products/:id`
- `DELETE /api/v1/products/:id`
- `POST /api/v1/orders`
- `GET /api/v1/orders`

Outcome:

- direct farmer-to-buyer transactions with order traceability

### 2. AI Crop Price Intelligence

Status: Implemented (v1 analytics)

Endpoints:

- `GET /api/v1/intelligence/prices?crop=maize&location=kaduna`

Current output:

- recommended selling price
- best-selling location signal
- demand trend: `rising`, `stable`, or `softening`

### 3. Cooperative Digital Wallet

Status: Implemented (core)

Endpoints:

- `GET /api/v1/wallet/balance`
- `GET /api/v1/wallet/transactions`
- `POST /api/v1/wallet/withdraw`
- `POST /api/v1/payment/*`

Outcome:

- secure payout flow and historical financial records for trust and scoring

### 4. Farmer Micro-Loan System

Status: Implemented (workflow-ready)

Endpoints:

- `POST /api/v1/loans`
- `GET /api/v1/loans/me`
- `GET /api/v1/loans` (admin)
- `PATCH /api/v1/loans/:id/review` (admin)
- `PATCH /api/v1/loans/:id/repay` (admin)

Current decision inputs:

- amount, purpose, farm size
- cooperative rating, sales score, requested term

### 5. Logistics & Produce Transport Network

Status: Implemented (dispatch lifecycle)

Endpoints:

- `POST /api/v1/logistics`
- `GET /api/v1/logistics/me`
- `GET /api/v1/logistics/:id`
- `PATCH /api/v1/logistics/:id/assign` (admin)
- `PATCH /api/v1/logistics/:id/status`

Supported lifecycle:

- `pending` -> `assigned` -> `in_transit` -> `delivered` (or `cancelled`)

### 6. Warehouse & Storage System

Status: Implemented (capacity-aware booking)

Endpoints:

- `GET /api/v1/warehouses`
- `POST /api/v1/warehouses` (admin)
- `POST /api/v1/warehouses/bookings`
- `GET /api/v1/warehouses/bookings/me`
- `PATCH /api/v1/warehouses/bookings/:id/release`

Outcome:

- inventory booking and release tied to warehouse capacity and receipt records

### 7. Agricultural Knowledge & Advisory Hub

Status: Implemented (rule-based)

Endpoints:

- `GET /api/v1/advisory`
- `GET /api/v1/advisory/feed?crop=rice&region=north-central&weather=heavy-rain`

Current feed content:

- planting guide
- fertilizer recommendation
- pest warning
- weather alert
- source references (FAO, IITA)

## Roles Enabled

- Farmers: sell, store, borrow, and receive payments
- Buyers: source produce and track fulfillment
- Logistics partners: execute transport requests with status tracking
- Warehouses: manage storage and release operations
- Admin/investors: supervise risk, approvals, and throughput

## Next 90-Day Hardening Plan

1. Add scoring policy engine for automated loan risk decisions.
2. Add external market feeds for stronger price forecast confidence.
3. Add logistics SLA KPIs (pickup time, transit time, completion rate).
4. Add warehouse expiry and cold-chain alerting.
5. Expand advisory coverage by crop and state-level conditions.

## Vision Reflection

DOS AGROLINK NIGERIA is positioned as a complete agricultural operating ecosystem, not only a marketplace. The seven capabilities above jointly support farmer income growth, buyer reliability, and nationwide agricultural efficiency.
