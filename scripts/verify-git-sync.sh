#!/usr/bin/env bash
# verify-git-sync.sh — re-verify the ISS-24 reconciliation state in one command.
# Asserts: no divergence from origin (behind must be 0), gitleaks clean on full
# history + working tree, and the local-only survivors (.env.test) are present
# and gitignored. Ahead-of-origin commits are reported (push-pending), not failed.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"
FAIL=0

git fetch origin --quiet

for BRANCH in main develop; do
  git show-ref --verify --quiet "refs/heads/$BRANCH" || continue
  read -r AHEAD BEHIND < <(git rev-list --left-right --count "$BRANCH...origin/$BRANCH" | tr '\t' ' ')
  if [ "$BEHIND" -ne 0 ]; then
    echo "FAIL: $BRANCH is $BEHIND behind origin/$BRANCH (divergence)"
    FAIL=1
  elif [ "$AHEAD" -ne 0 ]; then
    echo "OK:   $BRANCH matches origin/$BRANCH base, $AHEAD commit(s) ahead (push pending)"
  else
    echo "OK:   $BRANCH == origin/$BRANCH (0/0)"
  fi
done

if command -v gitleaks >/dev/null 2>&1; then
  # History scan uses .gitleaksignore, which baselines the 233 findings already
  # public in GitHub history (see that file's header; purge = T-210). Any NEW
  # secret still fails this check.
  if gitleaks git . >/dev/null 2>&1; then
    echo "OK:   gitleaks — git history clean (233 pre-T-210 public-history findings baselined in .gitleaksignore)"
  else
    echo "FAIL: gitleaks found NEW secrets in git history (beyond the .gitleaksignore baseline)"
    FAIL=1
  fi
  # Working-tree scan covers TRACKED files only: untracked gitignored .env*
  # files are supposed to hold secrets locally and must never be committed.
  TRACKED_TMP=$(mktemp -d)
  git archive HEAD | tar -x -C "$TRACKED_TMP"
  # Run from inside the archive so fingerprints are repo-relative and match
  # the .gitleaksignore baseline (which git archive includes).
  if (cd "$TRACKED_TMP" && gitleaks dir . >/dev/null 2>&1); then
    echo "OK:   gitleaks — tracked files clean (74 pre-T-210 tip findings baselined; all dead/dummy/public-by-design)"
  else
    echo "FAIL: gitleaks found NEW secrets in tracked files (beyond the .gitleaksignore baseline)"
    FAIL=1
  fi
  rm -rf "$TRACKED_TMP"
else
  echo "WARN: gitleaks not installed — history scan skipped"
fi

if [ -f .env.test ]; then
  if git check-ignore -q .env.test; then
    echo "OK:   .env.test present and gitignored"
  else
    echo "FAIL: .env.test present but NOT gitignored"
    FAIL=1
  fi
else
  echo "WARN: .env.test missing — restore from ~/repo-backups/aimpactscanner-env-test-preserved"
fi

for F in .env.mcp .env.local.backup staging-credentials.md; do
  if git ls-files --error-unmatch "$F" >/dev/null 2>&1; then
    echo "FAIL: $F is tracked — should not be"
    FAIL=1
  fi
done
echo "OK:   no purged secret files tracked"

exit $FAIL
