FROM php:8.2-apache

# Instalar cron, MySQL client y extensiones necesarias
RUN apt-get update && apt-get install -y \
    default-mysql-client \
    cron \
    unzip \
    git \
    libzip-dev \
    && docker-php-ext-install zip \
    && rm -rf /var/lib/apt/lists/*

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Habilitar mod_rewrite
RUN a2enmod rewrite

# Copiar configuración PHP
COPY php.ini /usr/local/etc/php/

# Copiar cron y permisos
COPY cronjob /etc/cron.d/cronjob
RUN chmod 0644 /etc/cron.d/cronjob && crontab /etc/cron.d/cronjob

# Script para iniciar apache + cron
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Instalar dependencias PHP (Google API Client)
WORKDIR /var/www/html/
COPY ./public /var/www/html/
RUN chown -R www-data:www-data /var/www/html && chmod -R 755 /var/www/html
RUN composer require google/apiclient:^2.0

EXPOSE 80

CMD ["/start.sh"]
