#!/usr/bin/env bash
set -euo pipefail

# PulsarTrack - Contract Initialization Script
# Runs after deploy.sh to initialize all contracts with admin and config

NETWORK="${STELLAR_NETWORK:-testnet}"
IDENTITY="${STELLAR_IDENTITY:-pulsartrack-deployer}"
DEPLOY_FILE="${1:-}"

if [ -z "$DEPLOY_FILE" ]; then
  # Find most recent deployment
  DEPLOY_FILE=$(ls -t "$(dirname "$0")/../deployments"/deployed-"$NETWORK"-*.json 2>/dev/null | head -1)
fi

if [ ! -f "$DEPLOY_FILE" ]; then
  echo "Error: No deployment file found. Run deploy.sh first."
  exit 1
fi

echo "=============================================="
echo "  PulsarTrack - Contract Initialization"
echo "  Network: $NETWORK"
echo "  Deployment: $DEPLOY_FILE"
echo "=============================================="

ADMIN_ADDRESS=$(stellar keys address "$IDENTITY")

# Helper: call a contract function
call_contract() {
  local CONTRACT_ID="$1"
  local FUNCTION="$2"
  shift 2
  stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source "$IDENTITY" \
    --network "$NETWORK" \
    -- "$FUNCTION" "$@" 2>/dev/null
}

# Read contract IDs from deploy file
read_contract() {
  python3 -c "import json; d=json.load(open('$DEPLOY_FILE')); print(d['contracts'].get('$1',''))" 2>/dev/null
}

echo ""
echo "[Init] Initializing Ad Registry..."
AD_REGISTRY=$(read_contract ad_registry)
[ -n "$AD_REGISTRY" ] && call_contract "$AD_REGISTRY" initialize --admin "$ADMIN_ADDRESS" && echo "  OK"

echo "[Init] Initializing Campaign Orchestrator..."
CAMPAIGN=$(read_contract campaign_orchestrator)
# Campaign orchestrator needs: admin, ad_registry contract, token address
NATIVE_TOKEN="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
[ -n "$CAMPAIGN" ] && call_contract "$CAMPAIGN" initialize \
  --admin "$ADMIN_ADDRESS" \
  --token "$NATIVE_TOKEN" \
  && echo "  OK"

echo "[Init] Initializing Governance Token..."
GOV_TOKEN=$(read_contract governance_token)
[ -n "$GOV_TOKEN" ] && call_contract "$GOV_TOKEN" initialize --admin "$ADMIN_ADDRESS" && echo "  OK"

echo "[Init] Initializing Publisher Reputation..."
PUB_REP=$(read_contract publisher_reputation)
[ -n "$PUB_REP" ] && call_contract "$PUB_REP" initialize \
  --admin "$ADMIN_ADDRESS" \
  --oracle "$ADMIN_ADDRESS" \
  && echo "  OK"

echo "[Init] Initializing Privacy Layer..."
PRIVACY=$(read_contract privacy_layer)
[ -n "$PRIVACY" ] && call_contract "$PRIVACY" initialize --admin "$ADMIN_ADDRESS" && echo "  OK"

echo "[Init] Initializing Targeting Engine..."
TARGETING=$(read_contract targeting_engine)
[ -n "$TARGETING" ] && call_contract "$TARGETING" initialize --admin "$ADMIN_ADDRESS" && echo "  OK"

echo "[Init] Initializing Subscription Manager..."
SUB_MGR=$(read_contract subscription_manager)
[ -n "$SUB_MGR" ] && call_contract "$SUB_MGR" initialize \
  --admin "$ADMIN_ADDRESS" \
  --token "$NATIVE_TOKEN" \
  --treasury "$ADMIN_ADDRESS" \
  && echo "  OK"

echo "[Init] Initializing Auction Engine..."
AUCTION=$(read_contract auction_engine)
[ -n "$AUCTION" ] && call_contract "$AUCTION" initialize \
  --admin "$ADMIN_ADDRESS" \
  --token "$NATIVE_TOKEN" \
  && echo "  OK"

echo "[Init] Initializing Identity Registry..."
IDENTITY_REG=$(read_contract identity_registry)
[ -n "$IDENTITY_REG" ] && call_contract "$IDENTITY_REG" initialize --admin "$ADMIN_ADDRESS" && echo "  OK"

echo ""
echo "=============================================="
echo "  Initialization complete!"
echo "=============================================="
