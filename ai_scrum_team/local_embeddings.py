"""
Local Embeddings Module for AI Scrum Team.

Uses sentence-transformers to generate embeddings locally without any API calls.
Model: 'all-MiniLM-L6-v2' (compact, fast, good quality - ~80MB download)
Alternative: 'all-mpnet-base-v2' (better quality, ~420MB)

Usage:
    from local_embeddings import get_embeddings
    vectors = get_embeddings(["hello world", "hola mundo"])
"""

import os
import hashlib
import pickle

# Cache directory for model and embeddings
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "embedding_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

# Default model - compact and fast
DEFAULT_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# Singleton model instance
_model = None


def _get_model():
    """Lazy-load the sentence-transformers model (singleton pattern)."""
    global _model
    if _model is None:
        print("[LocalEmbeddings] Cargando modelo local (all-MiniLM-L6-v2)...")
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(DEFAULT_MODEL, cache_folder=CACHE_DIR)
        print("[LocalEmbeddings] ✅ Modelo cargado exitosamente.")
    return _model


def get_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text strings.

    Args:
        texts: List of strings to embed.

    Returns:
        List of embedding vectors (each is a list of floats).
        Vector size: 384 (for all-MiniLM-L6-v2).

    Example:
        >>> vectors = get_embeddings(["Sistema de autenticación JWT"])
        >>> len(vectors[0])
        384
    """
    model = _get_model()
    embeddings = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
    return embeddings.tolist()


def get_embedding(text: str) -> list[float]:
    """
    Generate a single embedding vector for one text string.

    Args:
        text: The text to embed.

    Returns:
        A single embedding vector (list of 384 floats).
    """
    return get_embeddings([text])[0]


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """
    Compute cosine similarity between two embedding vectors.

    Returns:
        Float between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite).
    """
    import numpy as np
    a = np.array(vec_a)
    b = np.array(vec_b)
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))


def cache_embeddings(texts: list[str], tag: str = "default") -> dict:
    """
    Generate and cache embeddings to disk for reuse.

    Args:
        texts: List of texts to embed.
        tag: Cache identifier/key.

    Returns:
        Dict mapping text -> embedding vector.
    """
    cache_file = os.path.join(CACHE_DIR, f"cache_{tag}.pkl")

    # Try loading from cache
    if os.path.exists(cache_file):
        with open(cache_file, "rb") as f:
            cached = pickle.load(f)
        print(f"[LocalEmbeddings] ✅ Cache cargado ({len(cached)} vectores).")
        return cached

    # Generate and cache
    embeddings = get_embeddings(texts)
    result = {text: emb for text, emb in zip(texts, embeddings)}
    with open(cache_file, "wb") as f:
        pickle.dump(result, f)
    print(f"[LocalEmbeddings] 💾 Cache guardado ({len(result)} vectores).")
    return result


if __name__ == "__main__":
    # Quick self-test
    print("=" * 50)
    print("🧪 TEST: Embeddings Locales")
    print("=" * 50)

    test_texts = [
        "Sistema de autenticación JWT para API REST",
        "Login system with JSON Web Tokens",
        "Recetas de cocina colombiana",
    ]

    print(f"\nGenerando embeddings para {len(test_texts)} textos...")
    vecs = get_embeddings(test_texts)
    print(f"  Vector size: {len(vecs[0])}")
    print(f"  Tipo: {type(vecs[0])}")

    # Similarity test
    sim_01 = cosine_similarity(vecs[0], vecs[1])
    sim_02 = cosine_similarity(vecs[0], vecs[2])
    print(f"\n  Similitud (texto 0 vs 1 - mismo tema, distinto idioma): {sim_01:.4f}")
    print(f"  Similitud (texto 0 vs 2 - temas diferentes): {sim_02:.4f}")
    print(f"\n✅ Embeddings locales funcionando correctamente.")
