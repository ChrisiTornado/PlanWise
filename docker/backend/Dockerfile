FROM docker.io/debian:bookworm-slim
RUN apt-get update && apt-get install -y \
    supervisor \
    nginx \
    php-fpm \
    php-ctype \
    php-curl \
    php-mbstring \
    php-mysql \
    php-xml \
    composer \
    netcat-openbsd
COPY nginx.conf /etc/nginx/sites-available/default
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
STOPSIGNAL SIGQUIT
COPY ./launcher.sh /usr/bin/launcher.sh
RUN sed -i 's/\r$//' /usr/bin/launcher.sh && chmod +x /usr/bin/launcher.sh
CMD ["/bin/bash", "/usr/bin/launcher.sh"]
