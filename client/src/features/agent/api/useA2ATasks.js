import { useQuery } from '@tanstack/react-query';
import { a2aApi } from '../../../api/client';

/**
 * Query keys for A2A tasks
 */
export const a2aQueryKeys = {
  tasks: ['a2a-tasks'],
  task: (id) => ['a2a-task', id],
};

/**
 * Hook to poll A2A task list.
 * Returns the list of recent A2A tasks with their status.
 * @param {Object} options - react-query overrides
 */
export const useA2ATasks = (options = {}) => {
  return useQuery({
    queryKey: a2aQueryKeys.tasks,
    queryFn: () => a2aApi.listTasks(20),
    refetchInterval: options.refetchInterval ?? 15_000,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
    retry: 1,
    ...options,
  });
};

/**
 * Hook to fetch a single A2A task by ID.
 * Polls every 2 seconds while the task state is "working" or "submitted".
 */
export const useA2ATask = (taskId, options = {}) => {
  return useQuery({
    queryKey: a2aQueryKeys.task(taskId),
    queryFn: () => a2aApi.getTask(taskId, 10),
    enabled: !!taskId,
    refetchInterval: (query) => {
      const state = query?.state?.data?.status?.state;
      return state === 'working' || state === 'submitted' ? 2000 : false;
    },
    staleTime: 1_000,
    retry: 2,
    ...options,
  });
};
