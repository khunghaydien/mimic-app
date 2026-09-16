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

import { fromGenerateBody, useLibraryForm } from '@/api';
import { AppButton, IconButton, toast, useTheme } from '@/ui';
import { DeleteIcon, GenerateIcon, SaveIcon } from '@/ui/icon';

type Props = {
  libraryId: string | null;
  onClose: () => void;
};

type QuestionDraft = {
  key: string;
  id: string | null;
  content: string;
  hint: string;
};

type QuestionSnapshot = {
  id: string | null;
  content: string;
  hint: string;
};

let questionSeq = 0;

function createQuestion(
  content = '',
  id: string | null = null,
  hint = '',
): QuestionDraft {
  questionSeq += 1;
  return { key: id ?? `q-${questionSeq}`, id, content, hint };
}

function toDrafts(
  items: { id?: string | null; content: string; hint?: string }[],
): QuestionDraft[] {
  return items.map((item) =>
    createQuestion(item.content, item.id ?? null, item.hint ?? ''),
  );
}

function snapshotOf(items: QuestionDraft[]): QuestionSnapshot[] {
  return items.map((item) => ({
    id: item.id,
    content: item.content.trim(),
    hint: item.hint.trim(),
  }));
}

function isQuestionDirty(item: QuestionDraft, saved: QuestionSnapshot[]) {
  if (!item.id) return true;
  const orig = saved.find((row) => row.id === item.id);
  if (!orig) return true;
  return (
    orig.content !== item.content.trim() || orig.hint !== item.hint.trim()
  );
}

function areQuestionsChanged(
  items: QuestionDraft[],
  saved: QuestionSnapshot[],
) {
  if (items.length !== saved.length) return true;
  return items.some((item, index) => {
    const orig = saved[index];
    if (!orig) return true;
    return (
      orig.id !== item.id ||
      orig.content !== item.content.trim() ||
      orig.hint !== item.hint.trim()
    );
  });
}

export function LibraryForm({ libraryId, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, mode } = useTheme();
  const styles = useMemo(() => createStyles(colors, mode), [colors, mode]);
  const {
    detail,
    create,
    generate,
    update,
    addQuestion,
    updateQuestion,
    removeQuestion,
  } = useLibraryForm(libraryId);

  const [title, setTitle] = useState('');
  const [savedTitle, setSavedTitle] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [savedQuestions, setSavedQuestions] = useState<QuestionSnapshot[]>([]);
  const hydratedId = useRef<string | null>(null);
  const order = useQuestionOrder((from, to) => {
    setQuestions((current) => moveItem(current, from, to));
  });

  useEffect(() => {
    if (!libraryId) {
      hydratedId.current = null;
      setTitle('');
      setSavedTitle('');
      setQuestions([]);
      setSavedQuestions([]);
      return;
    }
    if (!detail.data || detail.data.id !== libraryId) return;
    if (hydratedId.current === libraryId) return;
    hydratedId.current = libraryId;
    const rows = toDrafts(detail.data.questions);
    setTitle(detail.data.title);
    setSavedTitle(detail.data.title.trim());
    setQuestions(rows);
    setSavedQuestions(snapshotOf(rows));
  }, [libraryId, detail.data]);

  const pending = create.isPending || generate.isPending;
  const saving =
    update.isPending ||
    addQuestion.isPending ||
    updateQuestion.isPending ||
    removeQuestion.isPending;
  const questionsChanged = areQuestionsChanged(questions, savedQuestions);
  const libraryDirty = title.trim() !== savedTitle || questionsChanged;

  const requireTitle = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.show('error', t('library.errorTitle'));
      return null;
    }
    return trimmed;
  };

  const questionPayload = (withId = false) =>
    questions.flatMap((item) => {
      const content = item.content.trim();
      const hint = item.hint.trim();
      if (!content) return [];
      if (withId && item.id) return [{ id: item.id, content, hint }];
      return [{ content, hint }];
    });

  const remember = (rows: QuestionDraft[]) => {
    setQuestions(rows);
    setSavedQuestions(snapshotOf(rows));
  };

  const onSaveLibrary = () => {
    const trimmedTitle = requireTitle();
    if (!trimmedTitle || !libraryId) return;
    update.mutate(
      {
        id: libraryId,
        title: trimmedTitle,
        questions: questionPayload(true),
      },
      {
        onSuccess: (data) => {
          setSavedTitle((data.title ?? trimmedTitle).trim());
          remember(data.questions ? toDrafts(data.questions) : questions);
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
    if (item.id) {
      updateQuestion.mutate(
        { id: libraryId, questionId: item.id, content, hint },
        {
          onSuccess: (updated) => {
            setSavedQuestions((current) =>
              current.map((row) =>
                row.id === updated.id
                  ? {
                      id: updated.id,
                      content: updated.content,
                      hint: updated.hint ?? hint,
                    }
                  : row,
              ),
            );
          },
        },
      );
      return;
    }
    addQuestion.mutate(
      { id: libraryId, content, hint },
      {
        onSuccess: (created) => {
          setQuestions((current) =>
            current.map((row) =>
              row.key === item.key
                ? {
                    ...row,
                    id: created.id,
                    content: created.content,
                    hint: created.hint ?? hint,
                  }
                : row,
            ),
          );
          setSavedQuestions((current) => [
            ...current,
            {
              id: created.id,
              content: created.content,
              hint: created.hint ?? hint,
            },
          ]);
        },
      },
    );
  };

  const onDeleteQuestion = (item: QuestionDraft) => {
    const drop = () => {
      setQuestions((current) => current.filter((row) => row.key !== item.key));
      setSavedQuestions((current) =>
        item.id ? current.filter((row) => row.id !== item.id) : current,
      );
    };
    if (!libraryId || !item.id) {
      drop();
      return;
    }
    removeQuestion.mutate(
      { id: libraryId, questionId: item.id },
      { onSuccess: drop },
    );
  };

  const onCreate = () => {
    const trimmedTitle = requireTitle();
    if (!trimmedTitle) return;
    const nextQuestions = questionPayload();
    create.mutate(
      {
        title: trimmedTitle,
        questions: nextQuestions.length > 0 ? nextQuestions : undefined,
      },
      { onSuccess: onClose },
    );
  };

  const onGenerate = () => {
    const trimmedTitle = requireTitle();
    if (!trimmedTitle) return;
    generate.mutate(trimmedTitle, {
      onSuccess: (data) => setQuestions(toDrafts(fromGenerateBody(data))),
    });
  };

  const patchQuestion = (
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.wrap}
    >
      {libraryId && detail.isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : (
        <View style={styles.body}>
          <View style={styles.header}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionLabel}>{t('library.fieldTitle')}</Text>
              {libraryId && libraryDirty ? (
                <IconButton
                  label={t('library.save')}
                  onPress={onSaveLibrary}
                  disabled={saving}
                  hitSlop={6}
                  style={styles.iconBtn}
                >
                  <SaveIcon color={colors.primary} />
                </IconButton>
              ) : null}
              {!libraryId ? (
                <IconButton
                  label={t('library.generate')}
                  onPress={onGenerate}
                  disabled={pending}
                  hitSlop={6}
                  style={styles.iconBtn}
                >
                  <GenerateIcon color={colors.primary} />
                </IconButton>
              ) : null}
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
            scrollEnabled={!order.dragging}
          >
            {questions.map((item, index) => (
              <View
                key={item.key}
                onLayout={(event) => {
                  order.setRowLayout(index, event.nativeEvent.layout);
                }}
                style={[
                  styles.questionBlock,
                  order.dropIndex === index && styles.questionDrop,
                ]}
                {...order.webRowProps(index)}
              >
                <View style={styles.questionToolbar}>
                  <QuestionIndex
                    label={t('library.questionLabel', { index: index + 1 })}
                    index={index}
                    color={colors.text}
                    onDragStart={() => order.onDragStart(index)}
                    onDragMove={order.onDragMove}
                    onDragEnd={order.onDragEnd}
                  />
                  {libraryId || questions.length > 1 ? (
                    <View style={styles.questionActions}>
                      {libraryId && isQuestionDirty(item, savedQuestions) ? (
                        <IconButton
                          label={t('library.save')}
                          onPress={() => onSaveQuestion(item)}
                          disabled={saving}
                          hitSlop={6}
                          style={styles.iconBtn}
                        >
                          <SaveIcon color={colors.primary} />
                        </IconButton>
                      ) : null}
                      <IconButton
                        label={t('library.delete')}
                        onPress={() => onDeleteQuestion(item)}
                        disabled={saving}
                        hitSlop={6}
                        style={styles.iconBtn}
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
                      patchQuestion(index, 'content', value)
                    }
                    placeholder={t('library.questionPlaceholder', {
                      index: index + 1,
                    })}
                    placeholderColor={colors.textMuted}
                    colors={colors}
                    style={styles.input}
                  />
                  <QuestionField
                    value={item.hint}
                    onChangeText={(value) =>
                      patchQuestion(index, 'hint', value)
                    }
                    placeholder={t('library.hintPlaceholder', {
                      index: index + 1,
                    })}
                    placeholderColor={colors.textMuted}
                    colors={colors}
                    style={styles.input}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {libraryId ? null : (
        <View style={styles.actionBar}>
          <AppButton
            label={t('library.save')}
            onPress={onCreate}
            disabled={pending}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  ) {
    return items;
  }
  const next = [...items];
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return next;
}

function useQuestionOrder(onMove: (from: number, to: number) => void) {
  const dragFrom = useRef<number | null>(null);
  const rowLayouts = useRef<{ y: number; height: number }[]>([]);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const targetIndex = (from: number, dy: number) => {
    const boxes = rowLayouts.current;
    const origin = boxes[from];
    if (!origin) return from;
    const point = origin.y + origin.height / 2 + dy;
    if (boxes[0] && point < boxes[0].y) return 0;
    const last = boxes[boxes.length - 1];
    if (last && point >= last.y + last.height) return boxes.length - 1;
    for (let i = 0; i < boxes.length; i += 1) {
      const box = boxes[i];
      if (box && point >= box.y && point < box.y + box.height) return i;
    }
    return from;
  };

  return {
    dragging,
    dropIndex,
    setRowLayout: (index: number, layout: { y: number; height: number }) => {
      rowLayouts.current[index] = layout;
    },
    webRowProps: (index: number) =>
      Platform.OS === 'web'
        ? {
            onDragOver: (event: { preventDefault: () => void }) => {
              event.preventDefault();
              if (dropIndex !== index) setDropIndex(index);
            },
            onDrop: (event: { preventDefault: () => void }) => {
              event.preventDefault();
              const from = dragFrom.current;
              dragFrom.current = null;
              setDropIndex(null);
              if (from == null) return;
              onMove(from, index);
            },
          }
        : {},
    onDragStart: (index: number) => {
      dragFrom.current = index;
      setDragging(true);
    },
    onDragMove: (dy: number) => {
      const from = dragFrom.current;
      if (from == null) return;
      const to = targetIndex(from, dy);
      setDropIndex((current) => (current === to ? current : to));
    },
    onDragEnd: (dy?: number) => {
      const from = dragFrom.current;
      dragFrom.current = null;
      setDragging(false);
      setDropIndex(null);
      if (from == null || dy == null) return;
      onMove(from, targetIndex(from, dy));
    },
  };
}

function QuestionIndex({
  label,
  color,
  index,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  label: string;
  color: string;
  index: number;
  onDragStart: () => void;
  onDragMove?: (dy: number) => void;
  onDragEnd: (dy?: number) => void;
}) {
  const dragStart = useRef(onDragStart);
  const dragMove = useRef(onDragMove);
  const dragEnd = useRef(onDragEnd);
  dragStart.current = onDragStart;
  dragMove.current = onDragMove;
  dragEnd.current = onDragEnd;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: () => dragStart.current(),
        onPanResponderMove: (_, gesture) => dragMove.current?.(gesture.dy),
        onPanResponderRelease: (_, gesture) => dragEnd.current(gesture.dy),
        onPanResponderTerminate: () => dragEnd.current(),
      }),
    [],
  );

  if (Platform.OS === 'web') {
    return createElement(
      'div',
      {
        draggable: true,
        title: 'Drag to reorder',
        onDragStart: (event: {
          dataTransfer: {
            effectAllowed: string;
            setData: (type: string, value: string) => void;
          };
        }) => {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', String(index));
          onDragStart();
        },
        onDragEnd: () => onDragEnd(),
        onDragOver: (event: { preventDefault: () => void }) => {
          event.preventDefault();
        },
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
    <View {...pan.panHandlers}>
      <Text style={{ fontSize: 16, fontWeight: '600', color }}>{label}</Text>
    </View>
  );
}

function QuestionField({
  value,
  onChangeText,
  placeholder,
  placeholderColor,
  colors,
  style,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  placeholderColor: string;
  colors: ReturnType<typeof useTheme>['colors'];
  style: object;
}) {
  const areaRef = useRef<HTMLTextAreaElement | null>(null);

  const grow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(46, el.scrollHeight)}px`;
  };

  useLayoutEffect(() => {
    if (Platform.OS !== 'web') return;
    grow(areaRef.current);
    const id = requestAnimationFrame(() => grow(areaRef.current));
    return () => cancelAnimationFrame(id);
  }, [value]);

  if (Platform.OS === 'web') {
    return createElement('textarea', {
      ref: areaRef,
      value,
      placeholder,
      onChange: (event: { currentTarget: HTMLTextAreaElement }) => {
        onChangeText(event.currentTarget.value);
        grow(event.currentTarget);
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
        fieldSizing: 'content',
      },
    });
  }

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderColor}
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
    wrap: {
      flex: 1,
    },
    loading: {
      flex: 1,
    },
    body: {
      flex: 1,
      minHeight: 0,
    },
    header: {
      paddingHorizontal: 16,
    },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      paddingBottom: 8,
    },
    sectionLabel: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    questionList: {
      flex: 1,
      minHeight: 0,
    },
    questionContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
      gap: 16,
    },
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
    questionBlock: {
      gap: 8,
    },
    questionDrop: {
      opacity: 0.7,
    },
    questionToolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 32,
    },
    questionFields: {
      gap: 8,
    },
    questionActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    iconBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        mode === 'dark' ? 'rgba(36, 48, 64, 0.5)' : 'rgba(220, 223, 228, 0.68)',
    },
    actionBar: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
    },
  });
}
