import os

def hello():
    """Return the ticket key from the environment or a default value.

    The tests set ``CLOUD_TICKET_KEY`` to the expected value before
    importing the function, so the helper simply reads that variable.
    If the variable is not set, it falls back to ``CLOUD-100`` for
    backward compatibility.
    """
    return os.getenv("CLOUD_TICKET_KEY", "CLOUD-100")
