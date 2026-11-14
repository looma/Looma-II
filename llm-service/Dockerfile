# looma-llm — llama.cpp server built for the ODROID-C4 (Cortex-A55).
#
# Why a custom build instead of ghcr.io/ggml-org/llama.cpp:server:
# the C4 runs kernel 4.9, which does not advertise the `asimddp` hwcap even
# though the Cortex-A55 executes SDOT/UDOT and FP16 arithmetic. The upstream
# image picks its CPU kernels by runtime hwcap detection, so on this box it
# falls back to plain ARMv8.0 code. Compiling the dotprod+fp16 kernels in
# unconditionally made prompt processing several times faster (measured on the
# box, see llm-service/README.md).
#
# Build ON the target (arm64):
#   docker build -t looma-llm:latest llm-service/
# On a box whose CPU lacks dotprod, override:
#   --build-arg ARM_ARCH=armv8-a

ARG LLAMA_CPP_TAG=b11889
ARG ARM_ARCH=armv8.2-a+dotprod+fp16

FROM debian:bookworm-slim AS build
ARG LLAMA_CPP_TAG
ARG ARM_ARCH
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential cmake git ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 --branch ${LLAMA_CPP_TAG} https://github.com/ggml-org/llama.cpp /src
WORKDIR /src
RUN cmake -B build \
        -DCMAKE_BUILD_TYPE=Release \
        -DBUILD_SHARED_LIBS=OFF \
        -DGGML_NATIVE=OFF \
        -DGGML_BACKEND_DL=OFF \
        -DGGML_CPU_ARM_ARCH=${ARM_ARCH} \
        -DGGML_OPENMP=ON \
        -DLLAMA_CURL=OFF \
        -DLLAMA_BUILD_TESTS=OFF \
        -DLLAMA_BUILD_EXAMPLES=OFF \
        -DLLAMA_BUILD_SERVER=ON \
 && cmake --build build --target llama-server llama-bench -j"$(nproc)"

FROM debian:bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends libgomp1 curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
COPY --from=build /src/build/bin/llama-server /src/build/bin/llama-bench /usr/local/bin/
EXPOSE 8091
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s \
  CMD curl -fsS http://127.0.0.1:8091/health || exit 1
ENTRYPOINT ["/usr/local/bin/llama-server"]
