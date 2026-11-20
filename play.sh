#!/bin/sh
# Flood-it launcher for Mac and Linux : makes sure raea (the engine that runs the game) is installed, offers to
# install it when it is not, then starts the game.
#
#   ./play.sh            play (asks before installing anything)
#   ./play.sh --yes      install raea without asking if it is missing, then play
#   ./play.sh --check    only check that everything is ready, do not start the game
#   ./play.sh --help     this text
#
# raea is installed in ~/.raea and linked in ~/.local/bin, nothing else on the computer is touched. The scores are kept
# in ~/.flood-it (set FLOOD_IT_DB to keep them somewhere else).

set -eu

here=$(cd "$(dirname "$0")" && pwd)
game="$here/src/edit.tsx"
installer_url="${RAEA_INSTALLER_URL:-https://raea.io/install}"

say() { printf '%s\n' "flood-it: $*"; }
fail() {
  printf '%s\n' "flood-it: $*" >&2
  exit 1
}

assume_yes=0
check_only=0
for argument in "$@"; do
  case "$argument" in
    --yes | -y) assume_yes=1 ;;
    --check) check_only=1 ;;
    --help | -h)
      sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) fail "unknown option $argument, try ./play.sh --help" ;;
  esac
done

[ -f "$game" ] || fail "can not find the game at $game, run this script from the flood-it folder."

# where raea puts itself, in case this shell does not know about it yet
PATH="$HOME/.local/bin:$HOME/.raea/bin:$PATH"
export PATH

# raea runs on a Mac with Apple Silicon and on x86_64 Linux
check_platform() {
  case "$(uname -s)/$(uname -m)" in
    Darwin/arm64 | Linux/x86_64) ;;
    Darwin/*) fail "raea needs a Mac with Apple Silicon (this Mac is $(uname -m)), so the game can not run here." ;;
    Linux/*) fail "raea runs on x86_64 Linux for now (this is $(uname -m)), so the game can not run here." ;;
    *) fail "this script is for Mac and Linux. On Windows, install raea from PowerShell (irm https://raea.io/install.ps1 | iex) then run : raea play src/edit.tsx" ;;
  esac
}

# asks a yes or no question, the answer is yes with --yes, no when nobody can answer
confirm() {
  [ "$assume_yes" -eq 1 ] && return 0
  { true </dev/tty; } 2>/dev/null || return 1
  printf '%s [y/N] ' "$1" >/dev/tty
  read -r answer </dev/tty || return 1
  case "$answer" in
    y | Y | yes | YES | Yes) return 0 ;;
    *) return 1 ;;
  esac
}

install_raea() {
  check_platform
  command -v curl >/dev/null 2>&1 || fail "curl is needed to download raea, please install it first."
  say "raea is not installed yet. It is the engine that runs this game (see https://raea.io)."
  say "Installing it downloads a few hundred MB from $installer_url and puts it in ~/.raea."
  confirm "Install raea now ?" || fail "raea is needed to play. Run ./play.sh --yes to install it without being asked, or install it yourself : curl -fsSL $installer_url | sh"
  installer=$(mktemp)
  trap 'rm -f "$installer"' EXIT
  curl -fsSL "$installer_url" -o "$installer" || fail "could not download the installer from $installer_url, check the connection."
  # the game does not need the agent skills raea can also add, so they are left out
  RAEA_NO_SKILLS=1 sh "$installer" || fail "the raea installer failed, its message is above."
  command -v raea >/dev/null 2>&1 || fail "raea was installed in ~/.raea but is not found, open a new terminal and run ./play.sh again."
}

command -v raea >/dev/null 2>&1 || install_raea

# a raea that is there but does not start usually lacks a system library, on Linux
version=$(raea --version 2>/dev/null) || fail "raea is installed but does not start. On Ubuntu or Debian, try : sudo apt install libasound2t64 libfontconfig1"
say "using raea $version"

if [ "$check_only" -eq 1 ]; then
  say "everything is ready, run ./play.sh to play."
  exit 0
fi

say "starting the game, a window opens (close it to quit)."
cd "$here"
exec raea play src/edit.tsx
