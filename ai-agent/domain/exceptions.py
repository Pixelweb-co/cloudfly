"""
domain/exceptions.py

Domain-specific exception hierarchy.

RetryableError   → Transient failures (network, DB pool exhausted, rate-limit).
                   The orchestrator will apply exponential backoff and retry.

NonRetryableError → Permanent failures (invalid payload, schema mismatch).
                    The orchestrator will skip retries and send to DLQ immediately.
"""


class AIAgentError(Exception):
    """Base exception for all AI Agent errors."""


class RetryableError(AIAgentError):
    """
    Use for: OpenAI timeouts, MySQL connection failures,
    Redis connection refused, Kafka producer errors.
    """


class NonRetryableError(AIAgentError):
    """
    Use for: missing required payload fields, malformed JSON,
    unknown function calls, business rule violations.
    """


class RateLimitExceededError(NonRetryableError):
    """Tenant has exhausted their daily AI call quota."""


class PipelineNotFoundError(RetryableError):
    """Contact has no pipeline assigned — typically transient until the pipeline is created."""
