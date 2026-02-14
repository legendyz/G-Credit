#!/bin/bash
# Check for Chinese characters in source code
# Used by CI and Husky pre-commit hook
# Story 11.21: TD-023 — CI Quality Gates

echo "Checking for Chinese characters..."

BACKEND_HITS=$(grep -rn '[\x{4E00}-\x{9FFF}]' gcredit-project/backend/src/ --include="*.ts" | grep -v '\.spec\.ts' | grep -v '\.test\.ts' || true)
FRONTEND_HITS=$(grep -rn '[\x{4E00}-\x{9FFF}]' gcredit-project/frontend/src/ --include="*.ts" --include="*.tsx" | grep -v '\.spec\.' | grep -v '\.test\.' | grep -v '__tests__' || true)

if [ -n "$BACKEND_HITS" ] || [ -n "$FRONTEND_HITS" ]; then
  echo "ERROR: Chinese characters found in production source code:"
  [ -n "$BACKEND_HITS" ] && echo "$BACKEND_HITS"
  [ -n "$FRONTEND_HITS" ] && echo "$FRONTEND_HITS"
  exit 1
fi

echo "✓ No Chinese characters found"
