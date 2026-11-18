<?php

namespace App\Exceptions;

use RuntimeException;

class RuleViolationException extends RuntimeException
{
    /**
     * @param array<string, string|array<int, string>> $fieldErrors
     */
    public function __construct(
        public readonly string $violationCode,
        string $message,
        public readonly array $fieldErrors = []
    ) {
        parent::__construct($message);
    }
}
