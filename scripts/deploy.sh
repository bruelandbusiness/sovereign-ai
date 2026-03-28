#!/bin/bash
# ============================================================================
# Sovereign AI — Production Deploy Script
# ============================================================================
# Runs all checks before deploying to Vercel production.
#
# Prerequisites:
#   - Vercel CLI installed: npm i -g vercel
#   - Logged in: vercel login
#   - Project linked: vercel link
#
# Usage: ./scripts/deploy.sh
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}=========================================="
echo "  Sovereign AI — Production Deploy"
echo -e "==========================================${NC}"
echo ""

# Step 1: Pre-flight checks
echo -e "${CYAN}Step 1: Pre-flight checks${NC}"

echo "  Running TypeScript check..."
npx tsc --noEmit 2>/dev/null && echo -e "  ${GREEN}✓${NC} TypeScript: No errors" || { echo -e "  ${RED}✗${NC} TypeScript errors found. Fix before deploying."; exit 1; }

echo "  Running tests..."
npx vitest run --project component 2>/dev/null | tail -1 | grep -q "passed" && echo -e "  ${GREEN}✓${NC} Tests: All passing" || { echo -e "  ${RED}✗${NC} Tests failed. Fix before deploying."; exit 1; }

echo "  Running build..."
SKIP_ENV_VALIDATION=1 DATABASE_URL="" npx next build 2>/dev/null | tail -1 | grep -q "server-rendered" && echo -e "  ${GREEN}✓${NC} Build: Successful" || { echo -e "  ${RED}✗${NC} Build failed. Fix before deploying."; exit 1; }

echo ""

# Step 2: Verify Vercel CLI
echo -e "${CYAN}Step 2: Vercel CLI${NC}"
if command -v vercel &> /dev/null; then
  echo -e "  ${GREEN}✓${NC} Vercel CLI installed"
else
  echo -e "  ${YELLOW}!${NC} Vercel CLI not found. Installing..."
  npm i -g vercel
fi
echo ""

# Step 3: Environment check
echo -e "${CYAN}Step 3: Critical env vars${NC}"
echo "  Ensure these are set in Vercel Dashboard → Settings → Environment Variables:"
echo ""
echo "  Required:"
echo "    DATABASE_URL"
echo "    DIRECT_URL"
echo "    AUTH_SECRET"
echo "    CRON_SECRET"
echo "    STRIPE_SECRET_KEY"
echo "    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
echo "    STRIPE_WEBHOOK_SECRET"
echo "    SENDGRID_API_KEY"
echo "    TWILIO_ACCOUNT_SID"
echo "    TWILIO_AUTH_TOKEN"
echo "    TWILIO_PHONE_NUMBER"
echo "    NEXT_PUBLIC_APP_URL=https://www.trysovereignai.com"
echo "    ENCRYPTION_KEY"
echo ""

# Step 4: Deploy
echo -e "${CYAN}Step 4: Deploy${NC}"
echo ""
read -p "  Deploy to production? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "  Deploying to production..."
  vercel --prod
  echo ""
  echo -e "${GREEN}=========================================="
  echo "  Deploy complete!"
  echo -e "==========================================${NC}"
  echo ""
  echo "  Post-deploy verification:"
  echo "  1. Visit https://www.trysovereignai.com"
  echo "  2. Check https://www.trysovereignai.com/api/health"
  echo "  3. Test magic link login"
  echo "  4. Verify cron jobs in Vercel dashboard"
  echo "  5. Monitor Sentry for errors"
else
  echo -e "  ${YELLOW}Deploy cancelled.${NC}"
fi
