#!/bin/bash
# Lokalni razvoj: pravi test bazu (za Pest) pored glavne i daje prava aplikacionom
# korisniku. MySQL image ga izvrsava samo pri prvoj inicijalizaciji volumena.
set -e
mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" <<SQL
CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}_test\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}_test\`.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
SQL
