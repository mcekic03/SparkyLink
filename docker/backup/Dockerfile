# Rezervne kopije: isti mysqldump kao baza (MySQL 8.4).
FROM mysql:8.4
COPY --chmod=755 backup.sh /usr/local/bin/sparkylink-backup
ENTRYPOINT ["sparkylink-backup"]
