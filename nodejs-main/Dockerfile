ARG CI_REGISTRY
ARG BASE_IMG_VERSION

FROM $CI_REGISTRY/ifood/docker-images/golden/dynamic_libraries_helper:1-stable as dynamic_helper

FROM debian:bullseye-slim as node

ARG VERSION
ARG BUILD_ARCH

RUN apt-get update && apt-get -y upgrade && apt-get install -y curl xz-utils

WORKDIR /tmp
ADD node_downloader.sh .
RUN bash node_downloader.sh $VERSION $BUILD_ARCH

WORKDIR /node

RUN cp /tmp/node/bin/node .

COPY --from=dynamic_helper /prepare-package.sh /prepare-package.sh
RUN chmod +x /prepare-package.sh && bash -c "/prepare-package.sh /node"

# create basic structure
RUN mkdir -p /app/node/

FROM $CI_REGISTRY/ifood/docker-images/golden/base:$BASE_IMG_VERSION

ENV PATH="${PATH}:/app/app"
# Prevent long loading times on NodeJS apps.
ENV PREEMPT_FIX_APP_PERMISSIONS="true"

COPY --from=node /app/node/ /app/node/

COPY --from=node /node/deps/* /app/deps/
COPY --from=node /node/node /app/node/node

#Copying version file so it will be accessible for executor
ADD .VERSION /

# Add executor variables
ADD .executor /

# Add nodejs specific permisssions file
ADD 01-permissions.yaml /.permissions/

# Reference base binaries in PATH
ENV PATH="${PATH}:/app/node"
