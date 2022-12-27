#!/usr/bin/env bash

# Bash strict mode: https://sipb.mit.edu/doc/safe-shell/
set -euf -o pipefail

main() {
  local version_type="${1:-}"
  shift

  validate_version_type "${version_type}"

  [[ -n $(git status -s) ]] && warn 'ERROR: Git working directory not clean.' && exit 1

  # We run install to make sure we didn't miss any dependencies changes
  # we also don't need to run build because install already triggers "prepare" which runs it
  run npm install
  run npm run test

  # this will change the package.json version and create a git tag commit,
  # we set the message to skip ci because we don't want to trigger actions on this commit,
  # since we have publish action when we do a github release below
  tag=$(run npm version "${version_type}" -m "%s [skip ci]")

  run git push --atomic origin main "${tag}"
  run gh release create "${tag}" --generate-notes
}

run() {
  warn "$@"
  "$@"
}

warn() {
  echo -e "($(basename "$0")) $*" 1>&2
}

validate_version_type() {
  local version_type="${1:-}"
  local valid_version_types=(major minor patch premajor preminor prepatch prerelease from-git)

  for valid_version_type in "${valid_version_types[@]}"; do
    if [[ "${version_type}" == "${valid_version_type}" ]]; then
      return 0
    fi
  done

  echo "Invalid version type '${version_type}' must be one of:" 1>&2
  echo "    $(join_by " | " "${valid_version_types[@]}")" 1>&2
  return 1
}

# bash function that joins a list by a delimeter
# https://stackoverflow.com/a/17841619/1093087
join_by() {
  local d=${1-} f=${2-}
  if shift 2; then
    printf %s "$f" "${@/#/$d}"
  fi
}

main "$@"
