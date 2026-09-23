import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useCreateLibrary, useGenerateQuestion } from '@/api';
import { AppButton, AppScreen, ConfirmModal, toast, useTheme } from '@/ui';
import { DeleteIcon, GenerateIcon, PlusIcon } from '@/ui/icon';

import {
  LibraryLayoutForm,
  LibraryIconButton,
  LibraryTitleField,
  LibraryQuestionDragProvider,
  LibraryQuestionList,
  LibraryQuestionRow,
} from './LibraryLayoutForm';

let questionKeySequence = 0;

const nextQuestionKey = () => {
  questionKeySequence += 1;
  return `question-${questionKeySequence}`;
};

type Draft = { key: string; content: string; hint: string };

export const LibraryScreenCreate = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const create = useCreateLibrary();
  const generate = useGenerateQuestion();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<Draft[]>([]);
  const drafts = useRef(new Map<string, () => Draft>());
  const listRef = useRef<ScrollView>(null);
  const pendingScroll = useRef(false);

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

  const addQuestion = useCallback(() => {
    pendingScroll.current = true;
    setQuestions((current) => [
      ...current,
      { key: nextQuestionKey(), content: '', hint: '' },
    ]);
  }, []);

  const collectQuestions = () =>
    questions
      .map((question) => drafts.current.get(question.key)?.() ?? question)
      .filter((question) => question.content)
      .map(({ content, hint }) => ({ content, hint }));

  const requireTitle = () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle) return trimmedTitle;
    toast.show('error', t('library.errorTitle'));
    return null;
  };

  const onGenerate = async () => {
    const trimmedTitle = requireTitle();
    if (!trimmedTitle) return;
    const generated = await generate.mutateAsync(trimmedTitle);
    setQuestions(
      Object.entries(generated)
        .sort(([left], [right]) => Number(left) - Number(right))
        .map(([, question]) => ({ key: nextQuestionKey(), ...question })),
    );
  };

  const onCreate = async () => {
    const trimmedTitle = requireTitle();
    if (!trimmedTitle) return;
    await create.mutateAsync({ title: trimmedTitle, questions: collectQuestions() });
    onClose();
  };

  return (
    <AppScreen style={screenStyle}>
      <LibraryLayoutForm
        footer={
          <View style={styles.bar}>
            <AppButton label={t('library.save')} onPress={onCreate} />
          </View>
        }
      >
        <LibraryTitleField
          value={title}
          onChange={setTitle}
          action={
            <View style={styles.actions}>
              <LibraryIconButton label={t('library.generate')} onPress={onGenerate}>
                <GenerateIcon color={colors.primary} />
              </LibraryIconButton>
              <LibraryIconButton label={t('library.addQuestion')} onPress={addQuestion}>
                <PlusIcon color={colors.primary} />
              </LibraryIconButton>
            </View>
          }
        />
        <LibraryQuestionDragProvider onMove={onMove}>
          <LibraryQuestionList
            ref={listRef}
            onContentSizeChange={() => {
              if (!pendingScroll.current) return;
              pendingScroll.current = false;
              listRef.current?.scrollToEnd({ animated: true });
            }}
          >
            {questions.map((question, index) => (
              <CreateQuestion
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
    </AppScreen>
  );
};

const CreateQuestion = memo(({
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

  useEffect(
    () =>
      registerDraft(initial.key, () => ({
        key: initial.key,
        content: content.trim(),
        hint: hint.trim(),
      })),
    [content, hint, initial.key, registerDraft],
  );

  return (
    <LibraryQuestionRow
      index={index}
      content={content}
      hint={hint}
      onContentChange={setContent}
      onHintChange={setHint}
      actions={<RemoveQuestion questionKey={initial.key} onRemoved={onRemoved} />}
    />
  );
});

const RemoveQuestion = ({
  questionKey,
  onRemoved,
}: {
  questionKey: string;
  onRemoved: (key: string) => void;
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
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
          onConfirm={() => {
            setOpen(false);
            onRemoved(questionKey);
          }}
        />
      ) : null}
    </>
  );
};

const screenStyle = { paddingBottom: 0 };
const styles = StyleSheet.create({
  bar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
