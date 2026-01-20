# About

This is the golden image for Golang applications. 

If you are a developer interested in migration/usage, check the section [Usage](https://code.ifoodcorp.com.br/ifood/docker-images/golden/nodejs/-/blob/master/README.md#Usage).

# Usage

If you are just interested in migrating or using the golden image, check the following sections in the [official documentation](https://ifood.atlassian.net/wiki/spaces/SEC/pages/3301606907/Golden+Images):  
[Sample projects](https://ifood.atlassian.net/wiki/spaces/SEC/pages/3301606907/Golden+Images#examples-of-sample-projects)  
[Real projects](https://ifood.atlassian.net/wiki/spaces/SEC/pages/3301606907/Golden+Images#examples-of-real-projects)  
[FAQ](https://ifood.atlassian.net/wiki/spaces/SEC/pages/3301606907/Golden+Images#faq)

Additional doubts, general questions or problems not responded by the documentation? Send a message to the @sec-eng team at the [#golden-images](https://ifood.slack.com/archives/C02P52DFRL5) slack channel.

# Internals

Similar to the golden images from Java, the NodeJS runtime is downloaded by the [**node_downloader.sh**](https://code.ifoodcorp.com.br/ifood/docker-images/golden/nodejs/-/blob/main/node_downloader.sh), this script just downloads a nodejs version and extracts it.

The build of the node golden image then proceeds as follows:  
(i) [Downloads](https://code.ifoodcorp.com.br/ifood/docker-images/golden/nodejs/-/blob/main/Dockerfile#L13) the golden image using the [**node_downloader.sh**](https://code.ifoodcorp.com.br/ifood/docker-images/golden/nodejs/-/blob/main/node_downloader.sh)    
(ii) [Adjust](https://code.ifoodcorp.com.br/ifood/docker-images/golden/nodejs/-/blob/main/Dockerfile#L21) dependencies paths in binaries and shared libraries.  
(iii) In the last stage, the steps performed are similar to the ones from other golden images with runtime. It includes [copying](https://code.ifoodcorp.com.br/ifood/docker-images/golden/nodejs/-/blob/main/Dockerfile#L33) the runtime and adding the [common files](https://code.ifoodcorp.com.br/ifood/docker-images/golden/nodejs/-/blob/main/Dockerfile#L39).  

Bellow, you'll find the contents of the Node golden images:
- [/.VERSION](https://code.ifoodcorp.com.br/ifood/docker-images/golden/nodejs/-/blob/main/node-16/.VERSION) file is used by two different processes. In the build process executed by the repository pipeline, it specifies the static image tag that will be generated. It also gets copied into the generated image and generates a line of log like `Golden Image Version - 1.2.0`
- [/.executor](https://code.ifoodcorp.com.br/ifood/docker-images/golden/nodejs/-/blob/main/.executor) file is loaded by the executor. The variables defined in it are only used to start the developer application, but not `executor` itself. It is only relevant to keep compatibility with the local debug scenario. 
- Base image files that can be check their content [here](https://code.ifoodcorp.com.br/ifood/docker-images/golden/base).
- Node Runtime to the specific flavor built, located at the /app/node/ folder.

# Local build (x86)
The build process is as follows:
1. **Prerequisites** You must first log into the VPN and also have a valid access token configured in your gitlab account. Check the [VPN configuration guide](https://sites.google.com/ifood.com.br/corporate/identity/tutorials/vpn-tech?authuser=1&pli=1) and [Gitlab access token guide](https://www.youtube.com/watch?v=IUFAM4EQ_qw). Be sure to create it with the following scopes: **read_api**, **read_repository** and **read_registry**.
2. **Clone this repository** by running `git clone https://code.ifoodcorp.com.br/ifood/docker-images/golden/nodejs` and `cd` into it.
3. **Build the image** by first copying the .VERSION file inside a `node-xx` folder to the root of the repo, and then running `docker build . --build-arg CI_REGISTRY=registry.infra.ifood-prod.com.br --build-arg BUILD_ARCH=amd64 --build-arg BASE_IMG_VERSION=1.2.0 --build-arg VERSION=v18.17.0 -t node18`. **Note** BASE_IMG_VERSION can be any version available from the [GOLDEN BASE](https://code.ifoodcorp.com.br/ifood/docker-images/golden/base/container_registry) image. Valid `VERSION` arguments are something like `v18.17.0`, they correspond to the folder names from the official [repo](https://nodejs.org/dist/).
4. If you want to go a little deeper, it's possible to check the contents of the generated image using the steps documented in the section [**Unpacking an image**](https://ifood.atlassian.net/wiki/spaces/SEC/pages/3301606907/Golden+Images#Unpacking-an-image) from the official documentation.
5. Because we have a runtime, it's possible to start this golden image with the command `docker run -it node18 "node --version"`.