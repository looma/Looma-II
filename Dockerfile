FROM php:7.4.33-apache
RUN pecl install mongodb-1.15.0
RUN apt-get update
RUN apt-get install -y net-tools
RUN apt-get install -y python3
RUN apt-get install -y python3-pip
RUN pip3 install torch>0+cpu -f https://download.pytorch.org/whl/torch_stable.html # this is necessary to avoid downloading unwanted NVIDIA libraries
RUN pip3 install langchain_huggingface qdrant_client sentence-transformers
COPY load_models.py load_models.py
RUN mkdir -p /tmp/.cache/hf
RUN export HF_HOME=/tmp/.cache/hf; python3 load_models.py
RUN chmod -R 777 /tmp/.cache/hf
COPY docker_httpd.conf /etc/apache2/apache2.conf
RUN mkdir -p /usr/local/var/www/Looma
COPY . /usr/local/var/www/Looma
RUN chown -R www-data:www-data /usr/local/var/www/Looma && chmod -R a+rX /usr/local/var/www/Looma

COPY docker_php.ini /usr/local/etc/php/php.ini
COPY launch.sh /bin/launch.sh
RUN pip3 install flask
RUN chmod +x /bin/launch.sh

# Download and install Piper TTS
RUN apt-get update && apt-get install -y --no-install-recommends wget unzip curl libcurl4 && rm -rf /var/lib/apt/lists/*
RUN apt-get install -y --reinstall --no-install-recommends curl libcurl4 && rm -rf /var/lib/apt/lists/*
RUN dpkg --print-architecture
RUN ARCH=$(dpkg --print-architecture); wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_$ARCH.tar.gz -O /tmp/piper.tar.gz
RUN tar -xzf /tmp/piper.tar.gz -C /usr/local/bin
RUN rm /tmp/piper.tar.gz

# The FASTEST tier only, deliberately. This board synthesizes slower than real
# time, so quality is a speed choice: medium is ~1.4x slower than x_low on the
# same sentence, and high is worse again — on an ODROID that is the difference
# between a lesson that flows and one that waits.
#
# "x_low only" is not possible: piper publishes exactly ONE x_low model and it is
# Nepali (ne_NP-google-x_low). English has no x_low at all, so its fastest tier is
# low — the 7 models below. Together: 8 models, ~450 MB, 25 voices on the Reading
# Settings page (the Nepali model carries 18 speakers).
#
# To offer medium/high as well, add their paths here; the page lists whatever is
# in the voice directory and labels the quality on its own.
ARG PIPER_EXTRA_VOICES="en/en_GB/alan/low/en_GB-alan-low en/en_GB/southern_english_female/low/en_GB-southern_english_female-low en/en_US/danny/low/en_US-danny-low en/en_US/kathleen/low/en_US-kathleen-low en/en_US/lessac/low/en_US-lessac-low en/en_US/ryan/low/en_US-ryan-low"
RUN set -eux; \
    mkdir -p /usr/share/piper; \
    base=https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0; \
    download() { \
        curl -fL --retry 8 --retry-delay 5 --retry-all-errors "$1" -o "$2"; \
    }; \
    voice() { \
        name=$(basename "$1"); \
        download "$base/$1.onnx"      "/usr/share/piper/$name.onnx"; \
        download "$base/$1.onnx.json" "/usr/share/piper/$name.onnx.json"; \
    }; \
    voice ne/ne_NP/google/x_low/ne_NP-google-x_low; \
    voice en/en_US/amy/low/en_US-amy-low; \
    for extra in $PIPER_EXTRA_VOICES; do \
        name=$(basename "$extra"); \
        voice "$extra" || { \
            echo "WARNING: optional voice $name not installed"; \
            rm -f "/usr/share/piper/$name.onnx" "/usr/share/piper/$name.onnx.json"; \
        }; \
    done; \
    ls -1 /usr/share/piper

# Add Piper to PATH
ENV PATH="/usr/local/bin/piper:${PATH}"

ENV DOCKER=1
CMD ["/bin/launch.sh"]
