<?php

namespace App\Sso;

use RuntimeException;

/**
 * Raised when an SSO identity cannot be mapped to a Customer account
 * (missing email, or an email that already belongs to a staff account).
 */
class SsoException extends RuntimeException {}
