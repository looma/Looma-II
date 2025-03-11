FROM php:apache-bullseye
RUN pecl install mongodb
RUN apt-get update
RUN apt-get install -y net-tools
RUN apt-get install -y python3
RUN apt-get install -y python3-pip
RUN pip3 install langchain_huggingface qdrant_client
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
ENV DOCKER=1
CMD ["/bin/launch.sh"]
