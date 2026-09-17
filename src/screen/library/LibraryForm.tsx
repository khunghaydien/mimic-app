import { createElement, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLibraryForm } from '@/api';
import { AppButton, IconButton, toast, useTheme } from '@/ui';
import { DeleteIcon, GenerateIcon, SaveIcon, SpeakerIcon } from '@/ui/icon';

import { QuestionAudioModal } from './QuestionAudioModal';

type QuestionDraft = {
  key: string;
  id: string | null;
  content: string;
  hint: string;
  audioUrl: string | null;
};

let questionKeySequence = 0;

function toQuestionDraft(question: {
  id?: string;
  content: string;
  hint: string;
  audioUrl?: string | null;
}): QuestionDraft {
  questionKeySequence += 1;
  return {
    key: question.id ?? `question-${questionKeySequence}`,
    id: question.id ?? null,
    content: question.content,
    hint: question.hint,
    audioUrl: question.audioUrl ?? null,
  };
}

export function LibraryForm({
  libraryId,
  onClose,
}: {
  libraryId: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { colors, mode } = useTheme();
  const styles = useMemo(() => createStyles(colors, mode), [colors, mode]);
  const { detail, create, generate, update, addQuestion, updateQuestion, removeQuestion } =
    useLibraryForm(libraryId);

  const [title, setTitle] = useState('');
  const [savedTitle, setSavedTitle] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [savedQuestions, setSavedQuestions] = useState<QuestionDraft[]>([]);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const loadedLibraryId = useRef<string | null>(null);
  const questionDrag = useQuestionDrag((fromIndex, toIndex) => {
    setQuestions((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  });

  useEffect(() => {
    if (!libraryId) {
      loadedLibraryId.current = null;
      setTitle('');
      setSavedTitle('');
      setQuestions([]);
      setSavedQuestions([]);
      setPlayingIndex(null);
      return;
    }
    if (!detail.data || loadedLibraryId.current === libraryId) return;
    loadedLibraryId.current = libraryId;
    const drafts = detail.data.questions.map(toQuestionDraft);
    setTitle(detail.data.title);
    setSavedTitle(detail.data.title);
    setQuestions(drafts);
    setSavedQuestions(drafts);
  }, [libraryId, detail.data]);

  const hasUnsavedLibraryChanges =
    title.trim() !== savedTitle ||
    questions.length !== savedQuestions.length ||
    questions.some(
      (question, index) =>
        question.id !== savedQuestions[index].id ||
        question.content.trim() !== savedQuestions[index].content.trim() ||
        question.hint.trim() !== savedQuestions[index].hint.trim(),
    );

  const toQuestionPayload = (includeId = false) =>
    questions
      .map((question) => ({
        ...(includeId && question.id ? { id: question.id } : {}),
        content: question.content.trim(),
        hint: question.hint.trim(),
      }))
      .filter((question) => question.content);

  const requireTitle = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) toast.show('error', t('library.errorTitle'));
    return trimmedTitle;
  };

  const onSaveLibrary = () => {
    const trimmedTitle = requireTitle();
    if (!trimmedTitle || !libraryId) return;
    update.mutate(
      { id: libraryId, title: trimmedTitle, questions: toQuestionPayload(true) },
      {
        onSuccess: (data) => {
          const drafts = data.questions.map(toQuestionDraft);
          setSavedTitle(data.title);
          setQuestions(drafts);
          setSavedQuestions(drafts);
        },
      },
    );
  };

  const onSaveQuestion = (item: QuestionDraft) => {
    const content = item.content.trim();
    const hint = item.hint.trim();
    if (!content) {
      toast.show('error', t('library.errorQuestion'));
      return;
    }
    if (!libraryId) return;

    const rememberSavedQuestion = (saved: {
      id: string;
      content: string;
      hint: string;
      audioUrl: string | null;
    }) => {
      setQuestions((current) =>
        current.map((row) => (row.key === item.key ? { ...row, ...saved } : row)),
      );
      setSavedQuestions((current) => {
        const index = current.findIndex((row) => row.id === saved.id);
        const next = { key: item.key, ...saved };
        if (index < 0) return [...current, next];
        return current.map((row, rowIndex) => (rowIndex === index ? next : row));
      });
    };

    if (item.id) {
      updateQuestion.mutate(
        { id: libraryId, questionId: item.id, content, hint },
        { onSuccess: rememberSavedQuestion },
      );
    } else {
      addQuestion.mutate(
        { id: libraryId, content, hint },
        { onSuccess: rememberSavedQuestion },
      );
    }
  };

  const onDeleteQuestion = (item: QuestionDraft) => {
    const removeFromForm = () => {
      setQuestions((current) => current.filter((row) => row.key !== item.key));
      setSavedQuestions((current) => current.filter((row) => row.key !== item.key));
    };
    if (libraryId && item.id) {
      removeQuestion.mutate(
        { id: libraryId, questionId: item.id },
        { onSuccess: removeFromForm },
      );
    } else {
      removeFromForm();
    }
  };

  const onCreateLibrary = () => {
    const trimmedTitle = requireTitle();
    if (!trimmedTitle) return;
    create.mutate(
      { title: trimmedTitle, questions: toQuestionPayload() },
      { onSuccess: onClose },
    );
  };

  const onGenerateQuestions = () => {
    const trimmedTitle = requireTitle();
    if (!trimmedTitle) return;
    generate.mutate(trimmedTitle, {
      onSuccess: (generated) =>
        setQuestions(
          Object.keys(generated)
            .sort((left, right) => Number(left) - Number(right))
            .map((key) => toQuestionDraft(generated[key]!)),
        ),
    });
  };

  const updateQuestionField = (
    index: number,
    field: 'content' | 'hint',
    value: string,
  ) => {
    setQuestions((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const playingQuestion = playingIndex == null ? null : questions[playingIndex];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {libraryId && detail.isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : (
        <View style={styles.body}>
          <View style={styles.header}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{t('library.fieldTitle')}</Text>
              {libraryId ? (
                hasUnsavedLibraryChanges ? (
                  <IconButton
                    label={t('library.save')}
                    onPress={onSaveLibrary}
                    hitSlop={6}
                    style={styles.iconButton}
                  >
                    <SaveIcon color={colors.primary} />
                  </IconButton>
                ) : null
              ) : (
                <IconButton
                  label={t('library.generate')}
                  onPress={onGenerateQuestions}
                  hitSlop={6}
                  style={styles.iconButton}
                >
                  <GenerateIcon color={colors.primary} />
                </IconButton>
              )}
            </View>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('library.titlePlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          </View>

          <ScrollView
            style={styles.questionList}
            contentContainerStyle={styles.questionContent}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!questionDrag.dragging}
          >
            {questions.map((item, index) => {
              const savedQuestion = savedQuestions.find(
                (row) => row.id && row.id === item.id,
              );
              const hasUnsavedQuestionChanges =
                !savedQuestion ||
                savedQuestion.content.trim() !== item.content.trim() ||
                savedQuestion.hint.trim() !== item.hint.trim();

              return (
                <View
                  key={item.key}
                  onLayout={(event) =>
                    questionDrag.setRowLayout(index, event.nativeEvent.layout)
                  }
                  style={[
                    styles.questionBlock,
                    questionDrag.dropIndex === index && styles.questionDrop,
                  ]}
                  {...questionDrag.webDragRowProps(index)}
                >
                  <View style={styles.questionToolbar}>
                    <QuestionDragHandle
                      label={t('library.questionLabel', { index: index + 1 })}
                      color={colors.text}
                      onDragStart={() => questionDrag.onDragStart(index)}
                      onDragMove={questionDrag.onDragMove}
                      onDragEnd={questionDrag.onDragEnd}
                    />
                    {libraryId || questions.length > 1 ? (
                      <View style={styles.questionActions}>
                        {libraryId && hasUnsavedQuestionChanges ? (
                          <IconButton
                            label={t('library.save')}
                            onPress={() => onSaveQuestion(item)}
                            hitSlop={6}
                            style={styles.iconButton}
                          >
                            <SaveIcon color={colors.primary} />
                          </IconButton>
                        ) : null}
                        {item.audioUrl ? (
                          <IconButton
                            label={t('library.playAudio')}
                            onPress={() => setPlayingIndex(index)}
                            hitSlop={6}
                            style={styles.iconButton}
                          >
                            <SpeakerIcon color={colors.primary} />
                          </IconButton>
                        ) : null}
                        <IconButton
                          label={t('library.delete')}
                          onPress={() => onDeleteQuestion(item)}
                          hitSlop={6}
                          style={styles.iconButton}
                        >
                          <DeleteIcon color={colors.danger} />
                        </IconButton>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.questionFields}>
                    <QuestionField
                      value={item.content}
                      onChangeText={(value) =>
                        updateQuestionField(index, 'content', value)
                      }
                      placeholder={t('library.questionPlaceholder', {
                        index: index + 1,
                      })}
                      colors={colors}
                      style={styles.input}
                    />
                    <QuestionField
                      value={item.hint}
                      onChangeText={(value) =>
                        updateQuestionField(index, 'hint', value)
                      }
                      placeholder={t('library.hintPlaceholder', {
                        index: index + 1,
                      })}
                      colors={colors}
                      style={styles.input}
                    />
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {libraryId ? null : (
        <View style={styles.actionBar}>
          <AppButton label={t('library.save')} onPress={onCreateLibrary} />
        </View>
      )}

      {playingIndex != null && playingQuestion?.audioUrl ? (
        <QuestionAudioModal
          questionIndex={playingIndex + 1}
          audioUrl={playingQuestion.audioUrl}
          content={playingQuestion.content}
          hint={playingQuestion.hint}
          onClose={() => setPlayingIndex(null)}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

function useQuestionDrag(onMove: (fromIndex: number, toIndex: number) => void) {
  const dragFromIndex = useRef<number | null>(null);
  const rowLayouts = useRef<{ y: number; height: number }[]>([]);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const dropIndexForOffset = (fromIndex: number, dragOffsetY: number) => {
    const layouts = rowLayouts.current;
    const origin = layouts[fromIndex];
    if (!origin || layouts.length === 0) return fromIndex;
    const dragY = origin.y + origin.height / 2 + dragOffsetY;
    if (dragY < layouts[0].y) return 0;
    const last = layouts[layouts.length - 1];
    if (dragY >= last.y + last.height) return layouts.length - 1;
    const index = layouts.findIndex(
      (layout) => dragY >= layout.y && dragY < layout.y + layout.height,
    );
    return index < 0 ? fromIndex : index;
  };

  return {
    dragging,
    dropIndex,
    setRowLayout: (index: number, layout: { y: number; height: number }) => {
      rowLayouts.current[index] = layout;
    },
    webDragRowProps: (index: number) =>
      Platform.OS === 'web'
        ? {
            onDragOver: (event: { preventDefault: () => void }) => {
              event.preventDefault();
              if (dropIndex !== index) setDropIndex(index);
            },
            onDrop: (event: { preventDefault: () => void }) => {
              event.preventDefault();
              const fromIndex = dragFromIndex.current;
              dragFromIndex.current = null;
              setDropIndex(null);
              if (fromIndex != null) onMove(fromIndex, index);
            },
          }
        : {},
    onDragStart: (index: number) => {
      dragFromIndex.current = index;
      setDragging(true);
    },
    onDragMove: (dragOffsetY: number) => {
      const fromIndex = dragFromIndex.current;
      if (fromIndex == null) return;
      const nextDropIndex = dropIndexForOffset(fromIndex, dragOffsetY);
      setDropIndex((current) => (current === nextDropIndex ? current : nextDropIndex));
    },
    onDragEnd: (dragOffsetY?: number) => {
      const fromIndex = dragFromIndex.current;
      dragFromIndex.current = null;
      setDragging(false);
      setDropIndex(null);
      if (fromIndex != null && dragOffsetY != null) {
        onMove(fromIndex, dropIndexForOffset(fromIndex, dragOffsetY));
      }
    },
  };
}

function QuestionDragHandle({
  label,
  color,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  label: string;
  color: string;
  onDragStart: () => void;
  onDragMove: (dragOffsetY: number) => void;
  onDragEnd: (dragOffsetY?: number) => void;
}) {
  const onDragStartRef = useRef(onDragStart);
  const onDragMoveRef = useRef(onDragMove);
  const onDragEndRef = useRef(onDragEnd);
  onDragStartRef.current = onDragStart;
  onDragMoveRef.current = onDragMove;
  onDragEndRef.current = onDragEnd;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: () => onDragStartRef.current(),
        onPanResponderMove: (_, gesture) => onDragMoveRef.current(gesture.dy),
        onPanResponderRelease: (_, gesture) => onDragEndRef.current(gesture.dy),
        onPanResponderTerminate: () => onDragEndRef.current(),
      }),
    [],
  );

  if (Platform.OS === 'web') {
    return createElement(
      'div',
      {
        draggable: true,
        onDragStart: (event: { dataTransfer: { effectAllowed: string } }) => {
          event.dataTransfer.effectAllowed = 'move';
          onDragStart();
        },
        onDragEnd: () => onDragEnd(),
        onDragOver: (event: { preventDefault: () => void }) => event.preventDefault(),
        style: {
          fontSize: 16,
          fontWeight: 600,
          color,
          cursor: 'grab',
          userSelect: 'none',
          flexShrink: 0,
        },
      },
      label,
    );
  }

  return (
    <View {...panResponder.panHandlers}>
      <Text style={{ fontSize: 16, fontWeight: '600', color }}>{label}</Text>
    </View>
  );
}

function QuestionField({
  value,
  onChangeText,
  placeholder,
  colors,
  style,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  colors: ReturnType<typeof useTheme>['colors'];
  style: object;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const fitTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(46, textarea.scrollHeight)}px`;
  };

  useLayoutEffect(() => {
    if (Platform.OS !== 'web') return;
    fitTextareaHeight(textareaRef.current);
  }, [value]);

  if (Platform.OS === 'web') {
    return createElement('textarea', {
      ref: textareaRef,
      value,
      placeholder,
      onChange: (event: { currentTarget: HTMLTextAreaElement }) => {
        onChangeText(event.currentTarget.value);
        fitTextareaHeight(event.currentTarget);
      },
      style: {
        boxSizing: 'border-box',
        width: '100%',
        minHeight: 46,
        margin: 0,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: colors.border,
        backgroundColor: colors.background,
        color: colors.text,
        borderRadius: 10,
        padding: '12px 14px',
        fontSize: 16,
        lineHeight: '22px',
        fontFamily: 'inherit',
        resize: 'none',
        overflow: 'hidden',
        outline: 'none',
      },
    });
  }

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      multiline
      scrollEnabled={false}
      textAlignVertical="top"
      style={[style, { minHeight: 46 }]}
    />
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  mode: ReturnType<typeof useTheme>['mode'],
) {
  return StyleSheet.create({
    container: { flex: 1 },
    loading: { flex: 1 },
    body: { flex: 1, minHeight: 0 },
    header: { paddingHorizontal: 16 },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      paddingBottom: 8,
    },
    sectionLabel: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
    questionList: { flex: 1, minHeight: 0 },
    questionContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, gap: 16 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      color: colors.text,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
    },
    questionBlock: { gap: 8 },
    questionDrop: { opacity: 0.7 },
    questionToolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 32,
    },
    questionFields: { gap: 8 },
    questionActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    iconButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        mode === 'dark' ? 'rgba(36, 48, 64, 0.5)' : 'rgba(220, 223, 228, 0.68)',
    },
    actionBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  });
}
