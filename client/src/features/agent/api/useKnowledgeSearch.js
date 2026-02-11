import { useQuery } from '@tanstack/react-query';
import { knowledgeApi } from '../../../api/client';

/**
 * Query keys for knowledge base
 */
export const knowledgeQueryKeys = {
  search: (q) => ['knowledge-search', q],
};

/**
 * Hook to search the knowledge base (Pinecone hybrid search)
 * Only fires when query is non-empty. Returns results array with score.
 * @param {string} query - search text
 * @param {Object} options - react-query overrides
 */
export const useKnowledgeSearch = (query, options = {}) => {
  return useQuery({
    queryKey: knowledgeQueryKeys.search(query),
    queryFn: () => knowledgeApi.search(query),
    enabled: !!query?.trim(),
    staleTime: 30_000,
    retry: 1,
    ...options,
  });
};
