FROM php:apache-bullseye
RUN pecl install mongodb
RUN apt-get update
RUN apt-get install -y net-tools
COPY docker_httpd.conf /etc/apache2/apache2.conf
COPY ./ /usr/local/var/www/Looma
COPY docker_php.ini /usr/local/etc/php/php.ini
ENV DOCKER=1
EXPOSE 8080
