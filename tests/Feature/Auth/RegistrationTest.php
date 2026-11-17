<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_screen_is_disabled(): void
    {
        // PRD strictly forbids public self-registration. Only Admin can create accounts.
        $response = $this->get('/register');

        $response->assertNotFound();
    }

    public function test_public_registration_cannot_be_submitted(): void
    {
        $response = $this->post('/register', [
            'name' => 'Attacker',
            'email' => 'attacker@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertNotFound();
    }
}
