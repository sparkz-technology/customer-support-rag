import { useMutation } from '@tanstack/react-query';
import { triageApi } from '../../../api/client';
import toast from 'react-hot-toast';
import { getToastErrorMessage } from '../../../shared/utils/errorUtils';

/**
 * Hook to run AI triage analysis on a ticket description.
 * Returns category, priority, and suggested first-response before ticket creation.
 */
export const useTriageAnalysis = () => {
  return useMutation({
    mutationFn: (description) => triageApi.analyze(description),
    onError: (err) => {
      toast.error(getToastErrorMessage(err) || 'AI triage failed');
    },
  });
};
