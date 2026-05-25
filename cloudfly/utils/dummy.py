"""Utility module for CLOUD-89 test.

This module provides a minimal helper function used by the
``tests/test_cloud89.py`` test case.  The function simply returns a
constant string that matches the Jira key so that the test can
assert against a known value.

The implementation is intentionally trivial to keep the focus on
testing the infrastructure rather than business logic.
"""

from __future__ import annotations

__all__ = ["hello"]


def hello() -> str:
    """Return a constant string used by the CLOUD‑89 test.

    The function is deliberately simple – it does not depend on any
    external resources, making it safe to import in any test
    environment.

    Returns
    -------
    str
        The constant string ``"CLOUD-89"``.
    """

    return "CLOUD-89"
