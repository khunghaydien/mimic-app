import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../QueryProvider';
import { LIBRARIES_PATHS } from './const';

export type QuestionBody = {
  content: string;
  hint: string;
};

export type UpdateQuestionBody = QuestionBody & {
  id?: string;
};

export type CreateLibraryDto = {
  title: string;
  questions?: QuestionBody[];
};

export type UpdateLibraryDto = {
  title: string;
  questions?: UpdateQuestionBody[];
};

export type GenerateQuestionsDto = Record<string, QuestionBody>;

export type ListLibrariesQueryDto = {
  title?: string;
  page?: number;
  limit?: number;
};

export type LibraryListItem = {
  id: string;
  title: string;
  creator: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type LibraryList = {
  items: LibraryListItem[];
  meta: { page: number; limit: number; total: number };
};

export type LibraryQuestion = QuestionBody & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type LibraryDetail = {
  id: string;
  title: string;
  creator: string;
  questions: LibraryQuestion[];
  createdAt: string;
  updatedAt: string;
};

export function fromGenerateBody(data: GenerateQuestionsDto): QuestionBody[] {
  return Object.keys(data)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => ({
      content: data[key]?.content ?? '',
      hint: data[key]?.hint ?? '',
    }))
    .filter((item) => item.content);
}

function listPath(query: ListLibrariesQueryDto) {
  const params = new URLSearchParams();
  if (query.title) params.set('title', query.title);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  return qs ? `${LIBRARIES_PATHS.LIST}?${qs}` : LIBRARIES_PATHS.LIST;
}

function useInvalidateLibraries() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['libraries'] });
}

export function useLibraryList(query: ListLibrariesQueryDto) {
  const invalidate = useInvalidateLibraries();

  const list = useInfiniteQuery({
    queryKey: ['libraries', 'list', query.title, query.limit],
    queryFn: ({ pageParam }) =>
      api.request<LibraryList>(
        listPath({ ...query, page: pageParam as number }),
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, limit, total } = lastPage.meta;
      return page * limit < total ? page + 1 : undefined;
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      api.request<{ id: string }>(LIBRARIES_PATHS.REMOVE(id), 'DELETE'),
    onSuccess: invalidate,
  });

  return { list, remove };
}

export function useLibraryForm(libraryId: string | null) {
  const invalidate = useInvalidateLibraries();

  const detail = useQuery({
    queryKey: ['libraries', libraryId],
    queryFn: () => api.request<LibraryDetail>(LIBRARIES_PATHS.GET(libraryId!)),
    enabled: !!libraryId,
  });

  const create = useMutation({
    mutationFn: (body: CreateLibraryDto) =>
      api.request<LibraryDetail>(LIBRARIES_PATHS.CREATE, 'POST', body),
    onSuccess: invalidate,
  });

  const generate = useMutation({
    mutationFn: (title: string) =>
      api.request<GenerateQuestionsDto>(LIBRARIES_PATHS.GENERATE, 'POST', {
        title,
      }),
  });

  const update = useMutation({
    mutationFn: ({ id, ...body }: UpdateLibraryDto & { id: string }) =>
      api.request<LibraryDetail>(LIBRARIES_PATHS.UPDATE(id), 'PUT', body),
    onSuccess: invalidate,
  });

  const addQuestion = useMutation({
    mutationFn: ({ id, ...body }: QuestionBody & { id: string }) =>
      api.request<LibraryQuestion>(
        LIBRARIES_PATHS.CREATE_QUESTION(id),
        'POST',
        body,
      ),
    onSuccess: invalidate,
  });

  const updateQuestion = useMutation({
    mutationFn: ({
      id,
      questionId,
      ...body
    }: QuestionBody & { id: string; questionId: string }) =>
      api.request<LibraryQuestion>(
        LIBRARIES_PATHS.UPDATE_QUESTION(id, questionId),
        'PATCH',
        body,
      ),
    onSuccess: invalidate,
  });

  const removeQuestion = useMutation({
    mutationFn: ({
      id,
      questionId,
    }: {
      id: string;
      questionId: string;
    }) =>
      api.request<{ id: string }>(
        LIBRARIES_PATHS.REMOVE_QUESTION(id, questionId),
        'DELETE',
      ),
    onSuccess: invalidate,
  });

  return {
    detail,
    create,
    generate,
    update,
    addQuestion,
    updateQuestion,
    removeQuestion,
  };
}
