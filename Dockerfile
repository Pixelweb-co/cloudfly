#FROM php:8.0.0-apache
#FROM php:8.2-cli
#ARG DEBIAN_FRONTEND=noninteractive

#RUN apt-get update \
#    && apt-get install -y sendmail libpng-dev libzip-dev zlib1g-dev libonig-dev libjpeg62-turbo-dev libfreetype6-dev jpegoptim optipng pngquant gifsicle libmagickwand-dev \
#    && rm -rf /var/lib/apt/lists/*



#RUN docker-php-ext-configure gd --with-jpeg --with-freetype \
#    && docker-php-ext-install gd mysqli mbstring zip pdo pdo_mysql

#RUN a2enmod rewrite

# Imagen base de PHP 8 con Apache
FROM php:8.2-apache

# Instalar extensiones necesarias
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Habilitar mod_rewrite de Apache
RUN a2enmod rewrite