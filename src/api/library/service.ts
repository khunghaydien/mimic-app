import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import { api } from '../QueryProvider';

const LIBRARY_PATH = '/libraries';
const libraryPath = (libraryId: string) => `${LIBRARY_PATH}/${libraryId}`;
const questionPath = (libraryId: string, questionId: string) =>
  `${libraryPath(libraryId)}/questions/${questionId}`;

export type Question = {
  id: string;
  content: string;
  hint: string;
  audioUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Library = {
  id: string;
  title: string;
  creator: string;
  questionCount: number;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
};

type LibraryPage = {
  items: Library[];
  meta: { page: number; limit: number; total: number };
};

type QuestionBody = { content: string; hint: string };

const invalidateLibrary = (queryClient: QueryClient) => {
  void queryClient.invalidateQueries({ queryKey: ['library'] });
};

export const canManageLibrary = (
  creator: string,
  user: { id: string; name: string; email: string },
) => creator === user.id || creator === user.name || creator === user.email;

export const useLibraryList = (searchTitle?: string, enabled = true) =>
  useInfiniteQuery({
    queryKey: ['library', 'list', searchTitle],
    queryFn: ({ pageParam }) => {
      const searchParams = new URLSearchParams({
        page: String(pageParam),
        limit: '20',
      });
      if (searchTitle) searchParams.set('title', searchTitle);
      return api.request<LibraryPage>(`${LIBRARY_PATH}?${searchParams}`);
    },
    initialPageParam: 1,
    enabled,
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.meta.page * lastPage.meta.limit < lastPage.meta.total;
      return hasMore ? lastPage.meta.page + 1 : undefined;
    },
  });

export const useLibrary = (libraryId: string) =>
  useQuery({
    queryKey: ['library', libraryId],
    queryFn: () => api.request<Library>(libraryPath(libraryId)),
  });

export const useCreateLibrary = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; questions: QuestionBody[] }) =>
      api.request<Library>(LIBRARY_PATH, 'POST', body),
    onSuccess: () => invalidateLibrary(queryClient),
  });
};

export const useUpdateLibrary = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      title,
      questions,
    }: {
      id: string;
      title: string;
      questions: (QuestionBody & { id: string })[];
    }) => api.request<Library>(libraryPath(id), 'PUT', { title, questions }),
    onSuccess: () => invalidateLibrary(queryClient),
  });
};

export const useDeleteLibrary = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (libraryId: string) =>
      api.request<{ id: string }>(libraryPath(libraryId), 'DELETE'),
    onSuccess: () => invalidateLibrary(queryClient),
  });
};

export const useGenerateQuestion = () =>
  useMutation({
    mutationFn: (title: string) =>
      api.request<Record<string, QuestionBody>>(`${LIBRARY_PATH}/generate`, 'POST', {
        title,
      }),
  });

export const useCreateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      libraryId,
      content,
      hint,
    }: {
      libraryId: string;
      content: string;
      hint: string;
    }) => api.request<Question>(`${libraryPath(libraryId)}/questions`, 'POST', { content, hint }),
    onSuccess: () => invalidateLibrary(queryClient),
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      libraryId,
      questionId,
      content,
      hint,
    }: {
      libraryId: string;
      questionId: string;
      content: string;
      hint: string;
    }) =>
      api.request<Question>(questionPath(libraryId, questionId), 'PATCH', { content, hint }),
    onSuccess: () => invalidateLibrary(queryClient),
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ libraryId, questionId }: { libraryId: string; questionId: string }) =>
      api.request<{ id: string }>(questionPath(libraryId, questionId), 'DELETE'),
    onSuccess: () => invalidateLibrary(queryClient),
  });
};
