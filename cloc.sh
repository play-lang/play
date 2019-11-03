#!/usr/bin/env bash

# ##################################################
# Use CLOC to count lines of code for this project.
#
# CLOC must be installed. If using homebrew, run
# brew install cloc
#
#

version="1.0.0"
echo ""
echo ""
echo "About to run cloc"
echo ""

cloc ./src --force-lang="TypeScript",ts --progress-rate=1 --by-file --exclude-dir=$(tr '\n' ',' < .clocignore)