#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
    echo 'Usage: sh scripts/deploy/release.sh <full-commit-sha> [--https]' >&2
    exit 1
fi
if ! printf '%s' "$1" | grep -Eq '^[0-9a-f]{40}$'; then
    echo 'Use the full 40-character commit SHA from a successful pipeline.' >&2
    exit 1
fi
export IMAGE_TAG="$1"
https_mode=0
case "${2-}" in
    --https) https_mode=1 ;;
    '') ;;
    *) echo 'Only --https is supported.' >&2; exit 1 ;;
esac
test -f infra/deploy/.env || { echo 'Create infra/deploy/.env first.' >&2; exit 1; }
compose() {
    if [ "$https_mode" = 1 ]; then
        docker compose --env-file infra/deploy/.env -f infra/deploy/compose.yml -f infra/deploy/compose.https.yml "$@"
    else
        docker compose --env-file infra/deploy/.env -f infra/deploy/compose.yml "$@"
    fi
}
compose config --quiet
compose pull
if [ -n "$(compose ps --all -q db)" ]; then
    sh scripts/deploy/backup.sh
fi
compose up -d --wait --wait-timeout 240
# Update only after the new release is healthy; a failed release keeps its old state.
umask 077
mkdir -p infra/deploy/backups
next_env=$(mktemp infra/deploy/backups/.env-next.XXXXXX)
awk -v tag="$IMAGE_TAG" '
    /^IMAGE_TAG=/ { print "IMAGE_TAG=" tag; found=1; next }
    { print }
    END { if (!found) print "IMAGE_TAG=" tag }
' infra/deploy/.env > "$next_env"
mv "$next_env" infra/deploy/.env
printf '%s\n' "$IMAGE_TAG" > infra/deploy/.release-state
echo "Healthy release: $IMAGE_TAG"
echo 'IMAGE_TAG persisted in infra/deploy/.env; database volumes retained.'
