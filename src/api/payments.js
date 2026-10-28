// src/api/payments.js
//
// Thin wrappers around the CampusOS payments/AI-package endpoints.
// All requests go through the shared `api` axios instance in ./client,
// which attaches the JWT and handles refresh-on-401 transparently.

import { api } from "./client";

/** GET /ai/packages/ — list active token bundles. */
export const listPackages = () => api.get("/ai/packages/").then((r) => r.data);

/** GET /ai/balance/ — current token balance for the logged-in user. */
export const getBalance = () => api.get("/ai/balance/").then((r) => r.data);

/**
 * POST /ai/purchase/ — start a Pesapal order.
 * @param {{package_id:number}} payload
 * @returns {Promise<{payment_url:string, transaction_id:number, reference:string}>}
 */
export const purchaseTokens = (payload) =>
  api.post("/ai/purchase/", payload).then((r) => r.data);

/**
 * GET /payments/:id/status/ — poll after returning from Pesapal.
 * @returns {Promise<{id:number, status:string, tokens_purchased:number,
 *                    amount_cents:number, reference:string,
 *                    created_at:string, completed_at:string|null}>}
 */
export const getPaymentStatus = (transactionId) =>
  api.get(`/payments/${transactionId}/status/`).then((r) => r.data);