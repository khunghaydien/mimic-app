import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  useDeleteQuestion,
  useLibrary,
  useUpdateLibrary,
  useUpdateQuestion,
  type Library,
  type Question,
} from '@/api';
import { AppScreen, ConfirmModal, toast, useTheme } from '@/ui';
import { DeleteIcon, SaveIcon } from '@/ui/icon';

import {
  LibraryLayoutForm,
  LibraryIconButton,
  LibraryTitleField,
  LibraryQuestionDragProvider,
  LibraryQuestionList,
  LibraryQuestionRow,
} from './LibraryLayoutForm';

type Draft = {
  key: string;
  id: string;
  content: string;
  hint: string;
  audioUrl: string | null;
};

const toDraft = (question: Question): Draft => ({
  key: question.id,
  ...question,
});

export const LibraryScreenUpdate = ({ libraryId }: { libraryId: string }) => {
  const { colors } = useTheme();
  const library = useLibrary(libraryId);

  if (!library.data) {
    return (
      <AppScreen style={screenStyle}>
        {library.isLoading ? (
          <ActivityIndicator color={colors.primary} style={loadingStyle} />
        ) : null}
      </AppScreen>
    );
  }

  return (
    <AppScreen style={screenStyle}>
      <UpdateLibraryForm library={library.data} />
    </AppScreen>
  );
};

const UpdateLibraryForm = ({ library }: { library: Library }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const update = useUpdateLibrary();
  const [title, setTitle] = useState(library.title);
  const [savedTitle, setSavedTitle] = useState(library.title);
  const [questions, setQuestions] = useState(() => library.questions.map(toDraft));
  const [savedOrder, setSavedOrder] = useState(() => library.questions.map((question) => question.id));
  const drafts = useRef(new Map<string, () => Draft>());

  const registerDraft = useCallback((key: string, getDraft: () => Draft) => {
    drafts.current.set(key, getDraft);
    return () => {
      drafts.current.delete(key);
    };
  }, []);

  const onMove = useCallback((fromIndex: number, toIndex: number) => {
    setQuestions((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const removeQuestion = useCallback((key: string) => {
    setQuestions((current) => current.filter((row) => row.key !== key));
  }, []);

  const collectQuestions = () =>
    questions
      .map((question) => drafts.current.get(question.key)?.() ?? question)
      .filter((question) => question.content)
      .map(({ id, content, hint }) => ({ id, content, hint }));

  const onSaveLibrary = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.show('error', t('library.errorTitle'));
      return;
    }
    const next = await update.mutateAsync({
      id: library.id,
      title: trimmedTitle,
      questions: collectQuestions(),
    });
    setTitle(next.title);
    setSavedTitle(next.title);
    setQuestions(next.questions.map(toDraft));
    setSavedOrder(next.questions.map((question) => question.id));
  };

  const titleDirty = title.trim() !== savedTitle.trim();
  const orderDirty =
    questions.map((question) => question.id).join() !== savedOrder.join();

  return (
    <LibraryLayoutForm>
      <LibraryTitleField
        value={title}
        onChange={setTitle}
        action={
          titleDirty || orderDirty ? (
            <LibraryIconButton label={t('library.save')} onPress={onSaveLibrary}>
              <SaveIcon color={colors.primary} />
            </LibraryIconButton>
          ) : null
        }
      />
      <LibraryQuestionDragProvider onMove={onMove}>
        <LibraryQuestionList>
          {questions.map((question, index) => (
            <UpdateQuestion
              key={question.key}
              index={index}
              initial={question}
              registerDraft={registerDraft}
              onRemoved={removeQuestion}
            />
          ))}
        </LibraryQuestionList>
      </LibraryQuestionDragProvider>
    </LibraryLayoutForm>
  );
};

const UpdateQuestion = memo(({
  index,
  initial,
  registerDraft,
  onRemoved,
}: {
  index: number;
  initial: Draft;
  registerDraft: (key: string, getDraft: () => Draft) => () => void;
  onRemoved: (key: string) => void;
}) => {
  const [content, setContent] = useState(initial.content);
  const [hint, setHint] = useState(initial.hint);
  const [questionId, setQuestionId] = useState(initial.id);
  const [audioUrl, setAudioUrl] = useState(initial.audioUrl);
  const [savedContent, setSavedContent] = useState(initial.content);
  const [savedHint, setSavedHint] = useState(initial.hint);
  const dirty = content.trim() !== savedContent.trim() || hint.trim() !== savedHint.trim();

  useEffect(
    () =>
      registerDraft(initial.key, () => ({
        key: initial.key,
        id: questionId,
        content: content.trim(),
        hint: hint.trim(),
        audioUrl,
      })),
    [audioUrl, content, hint, initial.key, questionId, registerDraft],
  );

  return (
    <LibraryQuestionRow
      index={index}
      content={content}
      hint={hint}
      onContentChange={setContent}
      onHintChange={setHint}
      actions={
        <>
          {dirty ? (
            <SaveQuestion
              questionId={questionId}
              content={content}
              hint={hint}
              onSaved={(saved) => {
                setQuestionId(saved.id);
                setContent(saved.content);
                setHint(saved.hint);
                setAudioUrl(saved.audioUrl);
                setSavedContent(saved.content);
                setSavedHint(saved.hint);
              }}
            />
          ) : null}
          <DeleteQuestion
            questionId={questionId}
            questionKey={initial.key}
            onDeleted={onRemoved}
          />
        </>
      }
    />
  );
});

const SaveQuestion = ({
  questionId,
  content,
  hint,
  onSaved,
}: {
  questionId: string;
  content: string;
  hint: string;
  onSaved: (question: Question) => void;
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const save = useUpdateQuestion();

  const onPress = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast.show('error', t('library.errorQuestion'));
      return;
    }
    const question = await save.mutateAsync({
      questionId,
      content: trimmedContent,
      hint: hint.trim(),
    });
    onSaved(question);
  };

  return (
    <LibraryIconButton label={t('library.save')} onPress={onPress}>
      <SaveIcon color={colors.primary} />
    </LibraryIconButton>
  );
};

const DeleteQuestion = ({
  questionId,
  questionKey,
  onDeleted,
}: {
  questionId: string;
  questionKey: string;
  onDeleted: (key: string) => void;
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const remove = useDeleteQuestion();
  const [open, setOpen] = useState(false);

  return (
    <>
      <LibraryIconButton label={t('library.delete')} onPress={() => setOpen(true)}>
        <DeleteIcon color={colors.danger} />
      </LibraryIconButton>
      {open ? (
        <ConfirmModal
          title={t('library.deleteQuestionConfirmTitle')}
          message={t('library.deleteQuestionConfirm')}
          cancelLabel={t('library.cancel')}
          confirmLabel={t('library.delete')}
          onClose={() => setOpen(false)}
          onConfirm={() =>
            remove.mutate(questionId, {
                onSuccess: () => {
                  setOpen(false);
                  onDeleted(questionKey);
                },
              },
            )
          }
        />
      ) : null}
    </>
  );
};

const screenStyle = { paddingBottom: 0 };
const loadingStyle = { flex: 1 };
