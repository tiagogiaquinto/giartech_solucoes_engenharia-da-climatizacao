/*
  # Habilitar extensão pgvector para embeddings

  1. Extensão
    - Habilita `vector` type para armazenar embeddings
    - Necessário para RAG e similarity search
*/

-- Habilitar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;