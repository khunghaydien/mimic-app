import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { api } from '../QueryProvider';

const PRACTICE_PATH = '/practice';
const ANSWER_PATH = '/answer';

export type PracticeAnswer = {
  id: string;
  practiceId: string;
  questionId: string;
  caption: string;
  audioUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type Practice = {
  id: string;
  libraryId: string;
  userId: string;
  answers: PracticeAnswer[];
  createdAt: string;
  updatedAt: string;
};

const invalidatePractice = (queryClient: QueryClient) => {
  void queryClient.invalidateQueries({ queryKey: ['practice'] });
};

export const useCreatePractice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (libraryId: string) =>
      api.request<Practice>(PRACTICE_PATH, 'POST', { libraryId }),
    onSuccess: () => invalidatePractice(queryClient),
  });
};

export const usePractice = (practiceId: string) =>
  useQuery({
    queryKey: ['practice', practiceId],
    queryFn: () => api.request<Practice>(`${PRACTICE_PATH}/${practiceId}`),
    enabled: Boolean(practiceId),
  });

export const useCreateAnswer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      uri,
      practiceId,
      questionId,
      name,
      type,
    }: {
      uri: string;
      practiceId: string;
      questionId: string;
      name?: string;
      type?: string;
    }) => {
      console.log('[answer] start', { uri, practiceId, questionId, name, type });
      try {
        const answer = await api.upload<PracticeAnswer>(ANSWER_PATH, uri, {
          fieldName: 'file',
          name,
          mimeType: type,
          parameters: { practiceId, questionId },
        });
        console.log('[answer] success', answer);
        return answer;
      } catch (error) {
        console.log('[answer] error', error);
        throw error;
      }
    },
    onSuccess: () => invalidatePractice(queryClient),
  });
};
