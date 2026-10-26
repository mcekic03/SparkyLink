<?php

/**
 * U Docker-u konfiguracija stize kroz env promenljive kontejnera (razvojna baza,
 * pravi SMTP). phpunit.xml ih pregazi sa force="true"; ovaj test cuva to pravilo,
 * jer bi inace RefreshDatabase obrisao razvojnu bazu, a testovi slali prave mejlove.
 */
uses(Tests\TestCase::class);

test('tests point at the test database and never send real mail', function () {
    expect(config('database.connections.mysql.database'))->toBe('sparkylink_test')
        ->and(config('mail.default'))->toBe('array')
        ->and(config('queue.default'))->toBe('sync');
});
