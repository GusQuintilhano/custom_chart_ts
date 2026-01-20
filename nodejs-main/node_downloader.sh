#!/bin/bash

# sanity checks
if [ -z "$BASH" ]; then
    echo "This script must be run using bash. Please install it, and then run this script using bash -c ./node_downloader.sh"
    exit 1
fi

if [ $(id -u) -ne 0 ]; then
    echo "This script must be run as root."
    exit 1
fi

if [[ $# -ne 2 ]]; then
    echo "Usage:"
    echo "bash node_downloader.sh <node version> <arch>"
    echo "got args 1-$1 2-$2"
    exit 1
fi
NODE_VERSION=$1

if [ "${2}" == "amd64" ]; then
    export NODE_ARCH="x64"
elif [ "${2}" == "arm64" ]; then
    export NODE_ARCH="arm64"
else
    echo "Architecture must either be arm64 or amd64'"
    exit 1
fi

echo "Downloading node $NODE_VERSION for $NODE_ARCH"

curl -L https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz > node.tar.xz
tar -xf node.tar.xz
mv node-${NODE_VERSION}-linux-${NODE_ARCH} node
