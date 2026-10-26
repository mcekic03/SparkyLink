#############################
# PHP (Laravel API)
#############################
FROM serversideup/php:8.4-fpm-nginx-alpine AS base
USER root
# gd: slike i sličice; intl: formatiranje; bcmath: brzo računanje novca (brick/math); exif: orijentacija fotografija
RUN install-php-extensions gd intl bcmath exif
USER www-data

FROM base AS prod
WORKDIR $APP_BASE_DIR
ENV COMPOSER_CACHE_DIR=/dev/null

COPY --chown=www-data:www-data composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --optimize-autoloader --no-interaction --no-ansi --no-progress
COPY --chown=www-data:www-data . ./
# Autoloader sa klasama aplikacije (composer install je bio pre kopiranja koda)
RUN composer dump-autoload --optimize --no-dev --no-interaction --no-scripts

#############################
# Alati za razvoj (composer, artisan, Pest) - samo lokalno, profil `tools`
#############################
FROM serversideup/php:8.4-cli-alpine AS tools
USER root
RUN install-php-extensions gd intl bcmath exif
