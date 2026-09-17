import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';

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

export function canManageLibrary(
  creator: string,
  user: { id: string; name: string; email: string },
) {
  return creator === user.id || creator === user.name || creator === user.email;
}

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

type LibraryListData = InfiniteData<LibraryListPage, number>;

function toListItem(library: LibraryDetail): LibraryListItem {
  return {
    id: library.id,
    title: library.title,
    creator: library.creator,
    questionCount: library.questions.length,
    createdAt: library.createdAt,
    updatedAt: library.updatedAt,
  };
}

function setLibraryDetail(queryClient: QueryClient, library: LibraryDetail) {
  queryClient.setQueryData(['libraries', library.id], library);
}

function mapLibraryList(
  queryClient: QueryClient,
  update: (data: LibraryListData) => LibraryListData,
) {
  queryClient.setQueriesData(
    { queryKey: ['libraries', 'list'] },
    (data: LibraryListData | undefined) => (data ? update(data) : data),
  );
}

function prependLibraryList(queryClient: QueryClient, library: LibraryDetail) {
  const item = toListItem(library);
  mapLibraryList(queryClient, (data) => {
    const [first, ...rest] = data.pages;
    if (!first) return data;
    const pages = [
      {
        ...first,
        items: [item, ...first.items.filter((row) => row.id !== item.id)],
      },
      ...rest,
    ];
    return {
      ...data,
      pages: pages.map((page) => ({
        ...page,
        meta: { ...page.meta, total: page.meta.total + 1 },
      })),
    };
  });
}

function patchLibraryListItem(
  queryClient: QueryClient,
  libraryId: string,
  patch: (item: LibraryListItem) => LibraryListItem | null,
) {
  mapLibraryList(queryClient, (data) => {
    let totalDelta = 0;
    const pages = data.pages.map((page) => {
      const items = page.items.flatMap((item) => {
        if (item.id !== libraryId) return [item];
        const next = patch(item);
        return next ? [next] : [];
      });
      totalDelta += items.length - page.items.length;
      return { ...page, items };
    });
    return {
      ...data,
      pages: pages.map((page) => ({
        ...page,
        meta: { ...page.meta, total: page.meta.total + totalDelta },
      })),
    };
  });
}

function setLibraryQuestion(
  queryClient: QueryClient,
  libraryId: string,
  question: LibraryQuestion,
  isNew: boolean,
) {
  queryClient.setQueryData(['libraries', libraryId], (current: LibraryDetail | undefined) => {
    if (!current) return current;
    return {
      ...current,
      questions: isNew
        ? [...current.questions, question]
        : current.questions.map((item) => (item.id === question.id ? question : item)),
      updatedAt: question.updatedAt,
    };
  });
  patchLibraryListItem(queryClient, libraryId, (item) => ({
    ...item,
    questionCount: isNew ? item.questionCount + 1 : item.questionCount,
    updatedAt: question.updatedAt,
  }));
}

function dropLibraryQuestion(
  queryClient: QueryClient,
  libraryId: string,
  questionId: string,
) {
  queryClient.setQueryData(['libraries', libraryId], (current: LibraryDetail | undefined) => {
    if (!current) return current;
    return {
      ...current,
      questions: current.questions.filter((item) => item.id !== questionId),
    };
  });
  patchLibraryListItem(queryClient, libraryId, (item) => ({
    ...item,
    questionCount: Math.max(0, item.questionCount - 1),
  }));
}

export function useLibraryList(searchTitle?: string, enabled = true) {
  const queryClient = useQueryClient();
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
    enabled,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page * lastPage.meta.limit < lastPage.meta.total
        ? lastPage.meta.page + 1
        : undefined,
  });

  const remove = useMutation({
    mutationFn: (libraryId: string) =>
      api.request<{ id: string }>(libraryPath(libraryId), 'DELETE'),
    onSuccess: (_data, libraryId) => {
      queryClient.removeQueries({ queryKey: ['libraries', libraryId] });
      patchLibraryListItem(queryClient, libraryId, () => null);
    },
  });

  return { list, remove };
}

export function useLibraryDetail(libraryId: string | null) {
  return useQuery({
    queryKey: ['libraries', libraryId],
    queryFn: () => api.request<LibraryDetail>(libraryPath(libraryId!)),
    enabled: !!libraryId,
  });
}

export function useLibraryForm(libraryId: string | null) {
  const queryClient = useQueryClient();
  const detail = useLibraryDetail(libraryId);

  const create = useMutation({
    mutationFn: (body: { title: string; questions: QuestionBody[] }) =>
      api.request<LibraryDetail>(LIBRARIES_PATH, 'POST', body),
    onSuccess: (library) => {
      setLibraryDetail(queryClient, library);
      prependLibraryList(queryClient, library);
    },
  });

  const generate = useMutation({
    mutationFn: (title: string) =>
      api.request<Record<string, QuestionBody>>(
        `${LIBRARIES_PATH}/generate`,
        'POST',
        { title },
      ),
  });

  const update = useMutation({
    mutationFn: ({
      id,
      title,
      questions,
    }: {
      id: string;
      title: string;
      questions: (QuestionBody & { id?: string })[];
    }) => api.request<LibraryDetail>(libraryPath(id), 'PUT', { title, questions }),
    onSuccess: (library) => {
      setLibraryDetail(queryClient, library);
      patchLibraryListItem(queryClient, library.id, () => toListItem(library));
    },
  });

  const addQuestion = useMutation({
    mutationFn: ({ id, ...body }: QuestionBody & { id: string }) =>
      api.request<LibraryQuestion>(`${libraryPath(id)}/questions`, 'POST', body),
    onSuccess: (question, { id }) => {
      setLibraryQuestion(queryClient, id, question, true);
    },
  });

  const updateQuestion = useMutation({
    mutationFn: ({
      id,
      questionId,
      ...body
    }: QuestionBody & { id: string; questionId: string }) =>
      api.request<LibraryQuestion>(questionPath(id, questionId), 'PATCH', body),
    onSuccess: (question, { id }) => {
      setLibraryQuestion(queryClient, id, question, false);
    },
  });

  const removeQuestion = useMutation({
    mutationFn: ({ id, questionId }: { id: string; questionId: string }) =>
      api.request<{ id: string }>(questionPath(id, questionId), 'DELETE'),
    onSuccess: (_data, { id, questionId }) => {
      dropLibraryQuestion(queryClient, id, questionId);
    },
  });

  return { detail, create, generate, update, addQuestion, updateQuestion, removeQuestion };
}
