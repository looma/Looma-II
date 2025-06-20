FROM php:apache-bullseye
RUN pecl install mongodb-1.20.0
RUN apt-get update
RUN apt-get install -y net-tools
RUN apt-get install -y python3
RUN apt-get install -y python3-pip
RUN pip3 install langchain_huggingface qdrant_client sentence-transformers
COPY load_models.py load_models.py
RUN mkdir -p /tmp/.cache/hf
RUN export HF_HOME=/tmp/.cache/hf; python3 load_models.py
RUN chmod -R 777 /tmp/.cache/hf
COPY docker_httpd.conf /etc/apache2/apache2.conf
RUN mkdir -p /usr/local/var/www/Looma
COPY docker_php.ini /usr/local/etc/php/php.ini
COPY search.py /bin/search.py
COPY launch.sh /bin/launch.sh
RUN pip3 install flask
RUN chmod +x /bin/search.py
RUN chmod +x /bin/launch.sh

# Download and install Piper TTS
RUN apt-get install -y wget unzip
RUN dpkg --print-architecture
RUN ARCH=$(dpkg --print-architecture); wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_$ARCH.tar.gz -O /tmp/piper.tar.gz
RUN tar -xzf /tmp/piper.tar.gz -C /usr/local/bin
RUN rm /tmp/piper.tar.gz

# Download Nepali models for Piper
RUN mkdir -p /usr/share/piper \
    && wget https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ne/ne_NP/google/medium/ne_NP-google-medium.onnx -O /usr/share/piper/ne_NP-google-medium.onnx \
    && wget https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ne/ne_NP/google/medium/ne_NP-google-medium.onnx.json -O /usr/share/piper/ne_NP-google-medium.onnx.json

RUN wget    https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx       -O /usr/share/piper/en_US-amy-medium.onnx \
    && wget https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/amy/medium/en_US-amy-medium.onnx.json  -O /usr/share/piper/en_US-amy-medium.onnx.json

# fill in XXX to load more voices
# RUN    wget https://huggingface.co/rhasspy/piper-voices/blob/main/en/XXX       -O /usr/share/piper/XXX \
#     && wget https://huggingface.co/rhasspy/piper-voices/blob/main/en/XXX.json  -O /usr/share/piper/XXX.json

# Add Piper to PATH
ENV PATH="/usr/local/bin/piper:${PATH}"

ENV DOCKER=1
CMD ["/bin/launch.sh"]
