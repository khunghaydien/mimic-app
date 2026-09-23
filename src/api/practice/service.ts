import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import { api } from '../QueryProvider';

const PRACTICE_PATH = '/practice';
const ANSWER_PATH = '/answer';

export type PracticeGradeScore = {
  score: number;
  comment: string;
};

export type PracticeGradeError = {
  original: string;
  correction: string;
  explanation: string;
};

export type PracticeGrade = {
  score: number;
  comment: string;
  relevance: PracticeGradeScore;
  vocabulary: PracticeGradeScore & {
    strengths: string[];
    improvements: string[];
  };
  grammar: PracticeGradeScore & {
    errors: PracticeGradeError[];
  };
  completeness: PracticeGradeScore & { missing: string[] };
};

export type PracticeAnswer = {
  id: string;
  practiceId: string;
  questionId: string;
  question?: string;
  caption: string;
  audioUrl: string;
  grade?: PracticeGrade;
  createdAt: string;
  updatedAt: string;
};

export type Practice = {
  id: string;
  libraryId: string;
  library?: string;
  userId: string;
  answers: PracticeAnswer[];
  createdAt: string;
  updatedAt: string;
};

export type PracticeListItem = {
  id: string;
  libraryId: string;
  library: string;
  userId: string;
  answerCount: number;
  score: number | null;
  createdAt: string;
  updatedAt: string;
};

type PracticePage = {
  items: PracticeListItem[];
  meta: { page: number; limit: number; total: number };
};

const invalidatePractice = (queryClient: QueryClient) => {
  void queryClient.invalidateQueries({ queryKey: ['practice'] });
};

export const usePracticeList = (enabled = true) =>
  useInfiniteQuery({
    queryKey: ['practice', 'list'],
    queryFn: ({ pageParam }) => {
      const searchParams = new URLSearchParams({
        page: String(pageParam),
        limit: '20',
      });
      return api.request<PracticePage>(`${PRACTICE_PATH}?${searchParams}`);
    },
    initialPageParam: 1,
    enabled,
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.meta.page * lastPage.meta.limit < lastPage.meta.total;
      return hasMore ? lastPage.meta.page + 1 : undefined;
    },
  });

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
      return api.upload<PracticeAnswer>(ANSWER_PATH, uri, {
        fieldName: 'file',
        name,
        mimeType: type,
        parameters: { practiceId, questionId },
      });
    },
    onSuccess: () => invalidatePractice(queryClient),
  });
};

export const useGradePractice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (practiceId: string) =>
      api.request<Practice>(`${PRACTICE_PATH}/${practiceId}/grade`, 'POST'),
    onSuccess: () => invalidatePractice(queryClient),
  });
};
