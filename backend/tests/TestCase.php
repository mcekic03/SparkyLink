<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Http;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Nijedan test ne sme da ode na pravi kurs, sajt Poreske uprave ili Gotenberg.
        Http::preventStrayRequests();
    }
}
