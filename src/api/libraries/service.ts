import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../QueryProvider';

const LIBRARIES_PATH = '/libraries';
const libraryPath = (libraryId: string) => `${LIBRARIES_PATH}/${libraryId}`;
const questionPath = (libraryId: string, questionId: string) =>
  `${libraryPath(libraryId)}/questions/${questionId}`;

type QuestionBody = { content: string; hint: string };
type LibraryQuestion = QuestionBody & {
  id: string;
  audioUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LibraryListItem = {
  id: string;
  title: string;
  creator: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
};

type LibraryDetail = {
  id: string;
  title: string;
  creator: string;
  questions: LibraryQuestion[];
  createdAt: string;
  updatedAt: string;
};

type LibraryListPage = {
  items: LibraryListItem[];
  meta: { page: number; limit: number; total: number };
};

function useInvalidateLibraries() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['libraries'] });
}

function useLibraryMutation<Result, Variables>(
  request: (variables: Variables) => Promise<Result>,
) {
  const invalidateLibraries = useInvalidateLibraries();
  return useMutation({ mutationFn: request, onSuccess: invalidateLibraries });
}

export function useLibraryList(searchTitle?: string) {
  const list = useInfiniteQuery({
    queryKey: ['libraries', 'list', searchTitle],
    queryFn: ({ pageParam }) => {
      const searchParams = new URLSearchParams({
        page: String(pageParam),
        limit: '20',
      });
      if (searchTitle) searchParams.set('title', searchTitle);
      return api.request<LibraryListPage>(`${LIBRARIES_PATH}?${searchParams}`);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page * lastPage.meta.limit < lastPage.meta.total
        ? lastPage.meta.page + 1
        : undefined,
  });

  const remove = useLibraryMutation((libraryId: string) =>
    api.request<{ id: string }>(libraryPath(libraryId), 'DELETE'),
  );

  return { list, remove };
}

export function useLibraryForm(libraryId: string | null) {
  const detail = useQuery({
    queryKey: ['libraries', libraryId],
    queryFn: () => api.request<LibraryDetail>(libraryPath(libraryId!)),
    enabled: !!libraryId,
  });

  const create = useLibraryMutation(
    (body: { title: string; questions: QuestionBody[] }) =>
      api.request<LibraryDetail>(LIBRARIES_PATH, 'POST', body),
  );

  const generate = useMutation({
    mutationFn: (title: string) =>
      api.request<Record<string, QuestionBody>>(
        `${LIBRARIES_PATH}/generate`,
        'POST',
        { title },
      ),
  });

  const update = useLibraryMutation(
    ({
      id,
      title,
      questions,
    }: {
      id: string;
      title: string;
      questions: (QuestionBody & { id?: string })[];
    }) => api.request<LibraryDetail>(libraryPath(id), 'PUT', { title, questions }),
  );

  const addQuestion = useLibraryMutation(
    ({ id, ...body }: QuestionBody & { id: string }) =>
      api.request<LibraryQuestion>(`${libraryPath(id)}/questions`, 'POST', body),
  );

  const updateQuestion = useLibraryMutation(
    ({
      id,
      questionId,
      ...body
    }: QuestionBody & { id: string; questionId: string }) =>
      api.request<LibraryQuestion>(questionPath(id, questionId), 'PATCH', body),
  );

  const removeQuestion = useLibraryMutation(
    ({ id, questionId }: { id: string; questionId: string }) =>
      api.request<{ id: string }>(questionPath(id, questionId), 'DELETE'),
  );

  return { detail, create, generate, update, addQuestion, updateQuestion, removeQuestion };
}
