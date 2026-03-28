#!/bin/bash
# ============================================================================
# Sovereign AI — Stripe Go-Live Script
# ============================================================================
# This script validates your Stripe configuration before switching to live mode.
# Run this BEFORE changing your .env keys from sk_test to sk_live.
#
# Usage: ./scripts/go-live-stripe.sh
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "=========================================="
echo "  Sovereign AI — Stripe Go-Live Checklist"
echo "=========================================="
echo ""

PASS=0
FAIL=0
WARN=0

check_pass() { echo -e "  ${GREEN}✓${NC} $1"; PASS=$((PASS+1)); }
check_fail() { echo -e "  ${RED}✗${NC} $1"; FAIL=$((FAIL+1)); }
check_warn() { echo -e "  ${YELLOW}!${NC} $1"; WARN=$((WARN+1)); }

# 1. Check current mode
echo "1. Current Stripe Configuration"
echo "   ---"
if [ -f .env.local ]; then
  if grep -q "sk_test" .env.local; then
    check_warn "Stripe is in TEST mode (sk_test key detected)"
  elif grep -q "sk_live" .env.local; then
    check_pass "Stripe is in LIVE mode"
  else
    check_fail "No Stripe key found in .env.local"
  fi

  if grep -q "STRIPE_WEBHOOK_SECRET" .env.local; then
    check_pass "Webhook secret configured"
  else
    check_fail "STRIPE_WEBHOOK_SECRET missing"
  fi
else
  check_fail ".env.local file not found"
fi
echo ""

# 2. Check Stripe products
echo "2. Stripe Products & Prices"
echo "   ---"
echo "   Before going live, ensure these products exist in your Stripe dashboard:"
echo ""
echo "   Product Name          | Price      | Billing"
echo "   --------------------- | ---------- | -------"
echo "   Sovereign AI Starter  | \$3,497/mo  | Monthly"
echo "   Sovereign AI Growth   | \$6,997/mo  | Monthly"
echo "   Sovereign AI Empire   | \$12,997/mo | Monthly"
echo ""
echo "   Also create annual pricing variants with 2-month discount."
echo ""

# 3. Check webhook endpoints
echo "3. Webhook Endpoints"
echo "   ---"
echo "   Configure these webhooks in Stripe Dashboard → Developers → Webhooks:"
echo ""
echo "   Endpoint: https://www.trysovereignai.com/api/payments/webhooks/stripe"
echo "   Events:"
echo "     - checkout.session.completed"
echo "     - customer.subscription.created"
echo "     - customer.subscription.updated"
echo "     - customer.subscription.deleted"
echo "     - customer.subscription.paused"
echo "     - customer.subscription.resumed"
echo "     - invoice.payment_succeeded"
echo "     - invoice.payment_failed"
echo "     - invoice.paid"
echo ""

# 4. Check environment
echo "4. Environment Variables to Update"
echo "   ---"
echo "   Replace in .env.local AND Vercel Environment Variables:"
echo ""
echo "   STRIPE_SECRET_KEY=sk_live_... (replace sk_test)"
echo "   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (replace pk_test)"
echo "   STRIPE_WEBHOOK_SECRET=whsec_... (new webhook secret from live endpoint)"
echo ""

# 5. Test checklist
echo "5. Post Go-Live Verification"
echo "   ---"
echo "   [ ] Create a test checkout with a real card (use \$1 test product)"
echo "   [ ] Verify webhook fires and subscription is created"
echo "   [ ] Verify welcome email is sent"
echo "   [ ] Verify services are auto-activated"
echo "   [ ] Verify Stripe Customer Portal works"
echo "   [ ] Refund the test charge"
echo "   [ ] Monitor Stripe webhook logs for 24 hours"
echo ""

# Summary
echo "=========================================="
echo "  Summary: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}, ${YELLOW}${WARN} warnings${NC}"
echo "=========================================="
echo ""

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}Fix the failures above before going live.${NC}"
  exit 1
else
  echo -e "${GREEN}Ready for go-live! Follow the steps above to switch to live keys.${NC}"
fi
