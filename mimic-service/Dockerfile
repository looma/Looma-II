FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates git gcc make autoconf automake libtool pkg-config \
        libpcre2-dev libasound2-dev python3 \
    && rm -rf /var/lib/apt/lists/*

RUN git clone --depth 1 https://github.com/MycroftAI/mimic1.git /tmp/mimic1 \
    && cd /tmp/mimic1 \
    && ./autogen.sh \
    && ./configure --prefix=/usr/local \
    && make -j"$(nproc)" \
    && make install \
    && ldconfig \
    && cd / \
    && rm -rf /tmp/mimic1

WORKDIR /app
COPY Looma/mimic-service/mimic_server.py /app/mimic_server.py
COPY voices /usr/share/mimic-voices

ENV LOOMA_MIMIC_VOICE_DIR=/usr/share/mimic-voices
EXPOSE 5003

CMD ["python3", "/app/mimic_server.py"]
