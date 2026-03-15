#!/usr/bin/env bash
set -euo pipefail

scan_mode="${1:-staged}"

if ! command -v git >/dev/null 2>&1; then
  echo "git is required." >&2
  exit 1
fi

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "gitleaks is required. Install project tools with 'mise install' or run commands through 'mise run'." >&2
  exit 1
fi

repo_root="$(git rev-parse --show-toplevel)"

case "$scan_mode" in
  staged)
    mapfile -t scan_files < <(git diff --cached --name-only --diff-filter=ACMR)
    label="staged"
    git_show_prefix=":"
    ;;
  tracked)
    mapfile -t scan_files < <(git ls-files)
    label="tracked"
    git_show_prefix="HEAD:"
    ;;
  *)
    echo "Usage: bash scripts/check-safe-commit.sh [staged|tracked]" >&2
    exit 1
    ;;
esac

if [[ "${#scan_files[@]}" -eq 0 ]]; then
  echo "Safety check passed for 0 ${label} file(s)."
  exit 0
fi

tmp_root="$(mktemp -d "${TMPDIR:-/tmp}/morning-brief-gitleaks-XXXXXX")"
cleanup() {
  rm -rf "$tmp_root"
}
trap cleanup EXIT

for file_path in "${scan_files[@]}"; do
  mkdir -p "$tmp_root/$(dirname "$file_path")"
  git show "${git_show_prefix}${file_path}" > "$tmp_root/$file_path"
done

gitleaks dir --no-banner --redact "$tmp_root"

home_dir_escaped="$(printf '%s\n' "$HOME" | sed 's/[.[\*^$()+?{|]/\\&/g')"
path_pattern="(${home_dir_escaped}|${home_dir_escaped}/Desktop|/mnt/c/Users/|C:\\\\Users\\\\|/Users/|/home/)"
findings=()

for file_path in "${scan_files[@]}"; do
  if match="$(git show "${git_show_prefix}${file_path}" | grep -a -n -m 1 -E "$path_pattern" || true)"; then
    if [[ -n "$match" ]]; then
      if [[ "$file_path" == "scripts/check-safe-commit.sh" ]] && [[ "$match" == *"path_pattern="* ]]; then
        continue
      fi
      findings+=("$file_path:$match")
    fi
  fi
done

if [[ "${#findings[@]}" -gt 0 ]]; then
  echo "Commit blocked by safety checks. Remove the following local absolute paths from staged files:" >&2
  for finding in "${findings[@]}"; do
    echo "- $finding" >&2
  done
  exit 1
fi

echo "Safety check passed for ${#scan_files[@]} ${label} file(s)."
