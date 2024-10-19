FROM php:apache-bullseye
RUN pecl install mongodb
RUN apt-get update
RUN apt-get install -y net-tools
RUN apt-get install -y python3
RUN apt-get install -y python3-pip
RUN pip3 install langchain_community sentence_transformers qdrant_client
COPY docker_httpd.conf /etc/apache2/apache2.conf
RUN mkdir -p /usr/local/var/www/Looma
COPY docker_php.ini /usr/local/etc/php/php.ini
ENV DOCKER=1
