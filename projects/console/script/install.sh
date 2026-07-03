#!/bin/sh
# Trumbo CLI installer (POSIX sh).
#
# Downloads the prebuilt Trumbo binary for your platform from the npm registry
# and installs it to ~/.trumbo/bin (or $TRUMBO_INSTALL_DIR). No Node, Bun, or
# npm required.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/xedro98/trembo/main/projects/console/script/install.sh | sh
#   curl -fsSL ... | sh -s -- --version 3.0.34 --install-dir /usr/local/bin
#
# Options:
#   --version <ver>      Version to install (default: latest published)
#   --install-dir <dir>  Directory to install the `trumbo` binary into
#                        (default: $HOME/.trumbo/bin, or $TRUMBO_INSTALL_DIR)
#   --dry-run            Print what would happen without writing files
#   -h, --help           Show this help and exit
#
# Environment:
#   TRUMBO_VERSION       Same as --version
#   TRUMBO_INSTALL_DIR   Same as --install-dir
#   TRUMBO_REGISTRY      npm registry base (default: https://registry.npmjs.org)

set -eu

VERSION="${TRUMBO_VERSION:-}"
INSTALL_DIR="${TRUMBO_INSTALL_DIR:-}"
REGISTRY="${TRUMBO_REGISTRY:-https://registry.npmjs.org}"
DRY_RUN=0

print_help() {
	# When run via a pipe (curl ... | sh), $0 is the shell, not this script,
	# so we can't read the header from disk — print a compact usage instead.
	if [ -r "$0" ] && [ "$(head -n1 "$0" 2>/dev/null)" = "#!/bin/sh" ]; then
		sed -n '2,/^$/p' "$0" | sed 's/^# \?//'
	else
		cat <<'EOF'
Trumbo CLI installer.

Usage:
  curl -fsSL https://raw.githubusercontent.com/xedro98/trembo/main/projects/console/script/install.sh | sh
  sh install.sh --version <ver> --install-dir <dir>

Options:
  --version <ver>      Version to install (default: latest published)
  --install-dir <dir>  Directory to install the trumbo binary into
  --dry-run            Print what would happen without writing files
  -h, --help           Show this help and exit

Environment:
  TRUMBO_VERSION       Same as --version
  TRUMBO_INSTALL_DIR   Same as --install-dir
  TRUMBO_REGISTRY      npm registry base (default: https://registry.npmjs.org)
EOF
	fi
}

while [ $# -gt 0 ]; do
	case "$1" in
		--version)
			VERSION="${2:-}"
			shift 2
			;;
		--version=*)
			VERSION="${1#--version=}"
			shift
			;;
		--install-dir)
			INSTALL_DIR="${2:-}"
			shift 2
			;;
		--install-dir=*)
			INSTALL_DIR="${1#--install-dir=}"
			shift
			;;
		--dry-run)
			DRY_RUN=1
			shift
			;;
		-h|--help)
			print_help
			exit 0
			;;
		*)
			echo "trumbo-install: unknown option: $1" >&2
			echo "Run with --help for usage." >&2
			exit 1
			;;
	esac
done

need() {
	command -v "$1" >/dev/null 2>&1 || {
		echo "trumbo-install: required command not found: $1" >&2
		exit 1
	}
}

need curl
need tar
need rm

# --- Detect platform -------------------------------------------------------
os_raw="$(uname -s)"
case "$os_raw" in
	Darwin) os=darwin ;;
	Linux) os=linux ;;
	MINGW*|MSYS*|CYGWIN*) os=windows ;;
	*) echo "trumbo-install: unsupported OS: $os_raw" >&2; exit 1 ;;
esac

arch="$(uname -m)"
case "$arch" in
	x86_64|amd64) arch=x64 ;;
	aarch64|arm64) arch=arm64 ;;
	armv7l) echo "trumbo-install: armv7 is not supported" >&2; exit 1 ;;
	*) echo "trumbo-install: unsupported architecture: $arch" >&2; exit 1 ;;
esac

# --- Resolve install directory --------------------------------------------
if [ -z "$INSTALL_DIR" ]; then
	if [ -n "${HOME:-}" ] && [ -d "$HOME" ]; then
		INSTALL_DIR="$HOME/.trumbo/bin"
	else
		echo "trumbo-install: could not determine HOME; pass --install-dir" >&2
		exit 1
	fi
fi

# --- Resolve version + tarball URL ----------------------------------------
pkg="@trumbodev/cli-${os}-${arch}"
# npm registry requires the scope slash to be URL-encoded in the path.
encoded_pkg=$(printf '%s' "$pkg" | sed 's|/|%2f|g')

if [ -z "$VERSION" ]; then
	url="${REGISTRY}/${encoded_pkg}/latest"
else
	url="${REGISTRY}/${encoded_pkg}/${VERSION}"
fi

echo "trumbo-install: resolving ${pkg} @ ${VERSION:-latest}"
echo "trumbo-install:   GET ${url}"

# Fetch the packument and pull the tarball URL out of dist.tarball.
# jq is not guaranteed to exist, so use sed/awk for a tiny JSON extraction.
response=$(curl -fsSL "$url") || {
	echo "trumbo-install: failed to fetch package metadata from ${url}" >&2
	exit 1
}

tarball=$(printf '%s' "$response" | sed -n 's/.*"tarball"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)
resolved_version=$(printf '%s' "$response" | sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)

if [ -z "$tarball" ]; then
	echo "trumbo-install: could not find dist.tarball in registry response" >&2
	printf '%s\n' "$response" >&2
	exit 1
fi
if [ -z "$resolved_version" ]; then
	echo "trumbo-install: could not find version in registry response" >&2
	exit 1
fi

binary_name=trumbo
[ "$os" = "windows" ] && binary_name=trumbo.exe

echo "trumbo-install: version ${resolved_version}"
echo "trumbo-install: tarball ${tarball}"

# --- Download + extract ----------------------------------------------------
tmpdir=$(mktemp -d 2>/dev/null || mktemp -d -t trumbo-install)
trap 'rm -rf "$tmpdir"' EXIT INT TERM

tarball_path="${tmpdir}/package.tgz"
echo "trumbo-install: downloading..."
curl -fsSL "$tarball" -o "$tarball_path" || {
	echo "trumbo-install: download failed" >&2
	exit 1
}

echo "trumbo-install: extracting..."
extract_dir="${tmpdir}/pkg"
mkdir -p "$extract_dir"
tar -xzf "$tarball_path" -C "$extract_dir"

# npm tarballs always unpack to a top-level "package/" directory.
src_binary="${extract_dir}/package/bin/${binary_name}"
if [ ! -f "$src_binary" ]; then
	echo "trumbo-install: binary not found in tarball at package/bin/${binary_name}" >&2
	exit 1
fi

dest_binary="${INSTALL_DIR}/${binary_name}"

if [ "$DRY_RUN" -eq 1 ]; then
	echo "trumbo-install: [dry-run] would install ${src_binary} -> ${dest_binary}"
	exit 0
fi

mkdir -p "$INSTALL_DIR"
# Replace any existing binary.
rm -f "$dest_binary"
cp "$src_binary" "$dest_binary"
chmod 755 "$dest_binary"

echo ""
echo "trumbo-install: installed ${dest_binary}"

# --- PATH guidance ---------------------------------------------------------
case ":${PATH:-}:" in
	*":${INSTALL_DIR}:"*)
		echo "trumbo-install: ${INSTALL_DIR} is already on your PATH."
		;;
	*)
		echo "trumbo-install: ${INSTALL_DIR} is not on your PATH."
		shell="$(basename "${SHELL:-sh}")"
		case "$shell" in
			fish)
				echo "  Add it with: fish_add_path ${INSTALL_DIR}"
				;;
			zsh|bash|sh|dash|ksh)
				echo "  Add this to your shell profile (~/.${shell}rc or ~/.profile):"
				echo "    export PATH=\"${INSTALL_DIR}:\$PATH\""
				;;
			*)
				echo "  Add ${INSTALL_DIR} to your PATH to use \`trumbo\`."
				;;
		esac
		;;
esac

echo ""
echo "trumbo-install: run \`trumbo --version\` to verify, then \`trumbo\` to start."
