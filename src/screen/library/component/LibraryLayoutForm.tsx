import {
  createContext,
  createElement,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
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

import { IconButton, useTheme } from '@/ui';

export const LibraryLayoutForm = ({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) => {
  return (
    <KeyboardAvoidingView
      behavior={
        {
          ios: 'padding' as const,
          android: undefined,
          web: undefined,
          macos: undefined,
          windows: undefined,
        }[Platform.OS]
      }
      style={styles.shell}
    >
      <View style={styles.body}>{children}</View>
      {footer}
    </KeyboardAvoidingView>
  );
};

export const LibraryTitleField = ({
  value,
  onChange,
  action,
}: {
  value: string;
  onChange: (value: string) => void;
  action: ReactNode;
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const titleStyles = useMemo(() => createTitleStyles(colors), [colors]);

  return (
    <View style={titleStyles.header}>
      <View style={titleStyles.row}>
        <Text style={titleStyles.label}>{t('library.fieldTitle')}</Text>
        {action}
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t('library.titlePlaceholder')}
        placeholderTextColor={colors.textMuted}
        style={titleStyles.input}
      />
    </View>
  );
};

export const LibraryIconButton = ({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) => {
  const { mode } = useTheme();
  return (
    <IconButton
      label={label}
      onPress={onPress}
      hitSlop={6}
      style={mode === 'dark' ? iconButtonStyles.dark : iconButtonStyles.light}
    >
      {children}
    </IconButton>
  );
};

export const LibraryQuestionInput = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => {
  const { colors } = useTheme();
  const native = (
    <NativeQuestionInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      colors={colors}
    />
  );
  return {
    web: (
      <WebQuestionInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        colors={colors}
      />
    ),
    ios: native,
    android: native,
    macos: native,
    windows: native,
  }[Platform.OS];
};

const NativeQuestionInput = ({
  value,
  onChange,
  placeholder,
  colors,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) => (
  <TextInput
    value={value}
    onChangeText={onChange}
    placeholder={placeholder}
    placeholderTextColor={colors.textMuted}
    multiline
    scrollEnabled={false}
    textAlignVertical="top"
    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
  />
);

const WebQuestionInput = ({
  value,
  onChange,
  placeholder,
  colors,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const fitHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(46, textarea.scrollHeight)}px`;
  };

  useLayoutEffect(() => {
    if (textareaRef.current) fitHeight(textareaRef.current);
  }, [value]);

  return createElement('textarea', {
    ref: textareaRef,
    value,
    placeholder,
    onChange: (event: { currentTarget: HTMLTextAreaElement }) => {
      onChange(event.currentTarget.value);
      fitHeight(event.currentTarget);
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
};

type DragApi = {
  dragging: boolean;
  dropIndex: number | null;
  setRowLayout: (index: number, layout: { y: number; height: number }) => void;
  webDragRowProps: (index: number) => object;
  onDragStart: (index: number) => void;
  onDragMove: (dragOffsetY: number) => void;
  onDragEnd: (dragOffsetY?: number) => void;
};

const DragContext = createContext<DragApi | null>(null);

export const LibraryQuestionDragProvider = ({
  onMove,
  children,
}: {
  onMove: (fromIndex: number, toIndex: number) => void;
  children: ReactNode;
}) => {
  const dragFromIndex = useRef<number | null>(null);
  const rowLayouts = useRef<{ y: number; height: number }[]>([]);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

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

  const drag = useMemo<DragApi>(
    () => ({
      dragging,
      dropIndex,
      setRowLayout: (index, layout) => {
        rowLayouts.current[index] = layout;
      },
      webDragRowProps: (index) => {
        const none = () => ({});
        return {
          web: () => ({
            onDragOver: (event: { preventDefault: () => void }) => {
              event.preventDefault();
              if (dropIndex !== index) setDropIndex(index);
            },
            onDrop: (event: { preventDefault: () => void }) => {
              event.preventDefault();
              const fromIndex = dragFromIndex.current;
              dragFromIndex.current = null;
              setDropIndex(null);
              if (fromIndex != null) onMoveRef.current(fromIndex, index);
            },
          }),
          ios: none,
          android: none,
          macos: none,
          windows: none,
        }[Platform.OS]();
      },
      onDragStart: (index) => {
        dragFromIndex.current = index;
        setDragging(true);
      },
      onDragMove: (dragOffsetY) => {
        const fromIndex = dragFromIndex.current;
        if (fromIndex == null) return;
        const next = dropIndexForOffset(fromIndex, dragOffsetY);
        setDropIndex((current) => (current === next ? current : next));
      },
      onDragEnd: (dragOffsetY?: number) => {
        const fromIndex = dragFromIndex.current;
        dragFromIndex.current = null;
        setDragging(false);
        setDropIndex(null);
        if (fromIndex == null || dragOffsetY == null) return;
        onMoveRef.current(fromIndex, dropIndexForOffset(fromIndex, dragOffsetY));
      },
    }),
    [dragging, dropIndex],
  );

  return <DragContext.Provider value={drag}>{children}</DragContext.Provider>;
};

const useLibraryQuestionDrag = () => {
  const drag = useContext(DragContext);
  if (!drag) throw new Error('LibraryQuestionDragProvider is required');
  return drag;
};

export const LibraryQuestionList = ({ children }: { children: ReactNode }) => {
  const { dragging } = useLibraryQuestionDrag();
  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={!dragging}
    >
      {children}
    </ScrollView>
  );
};

export const LibraryQuestionRow = ({
  index,
  actions,
  content,
  hint,
  onContentChange,
  onHintChange,
}: {
  index: number;
  actions: ReactNode;
  content: string;
  hint: string;
  onContentChange: (value: string) => void;
  onHintChange: (value: string) => void;
}) => {
  const { t } = useTranslation();
  const drag = useLibraryQuestionDrag();

  return (
    <View
      onLayout={(event) => drag.setRowLayout(index, event.nativeEvent.layout)}
      style={[styles.row, drag.dropIndex === index && styles.drop]}
      {...drag.webDragRowProps(index)}
    >
      <View style={styles.toolbar}>
        <LibraryQuestionDragHandle index={index} />
        <View style={styles.actions}>{actions}</View>
      </View>
      <LibraryQuestionInput
        value={content}
        onChange={onContentChange}
        placeholder={t('library.questionPlaceholder', { index: index + 1 })}
      />
      <LibraryQuestionInput
        value={hint}
        onChange={onHintChange}
        placeholder={t('library.hintPlaceholder', { index: index + 1 })}
      />
    </View>
  );
};

const LibraryQuestionDragHandle = ({ index }: { index: number }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const drag = useLibraryQuestionDrag();
  const label = t('library.questionLabel', { index: index + 1 });

  const native = (
    <NativeQuestionDragHandle index={index} label={label} color={colors.text} />
  );
  return {
    web: (
      <WebQuestionDragHandle
        index={index}
        label={label}
        color={colors.text}
        onDragStart={drag.onDragStart}
        onDragEnd={drag.onDragEnd}
      />
    ),
    ios: native,
    android: native,
    macos: native,
    windows: native,
  }[Platform.OS];
};

const WebQuestionDragHandle = ({
  index,
  label,
  color,
  onDragStart,
  onDragEnd,
}: {
  index: number;
  label: string;
  color: string;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
}) =>
  createElement(
    'div',
    {
      draggable: true,
      onDragStart: (event: { dataTransfer: { effectAllowed: string } }) => {
        event.dataTransfer.effectAllowed = 'move';
        onDragStart(index);
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

const NativeQuestionDragHandle = ({
  index,
  label,
  color,
}: {
  index: number;
  label: string;
  color: string;
}) => {
  const drag = useLibraryQuestionDrag();
  const onDragStartRef = useRef(() => drag.onDragStart(index));
  const onDragMoveRef = useRef(drag.onDragMove);
  const onDragEndRef = useRef(drag.onDragEnd);
  onDragStartRef.current = () => drag.onDragStart(index);
  onDragMoveRef.current = drag.onDragMove;
  onDragEndRef.current = drag.onDragEnd;

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

  return (
    <View {...panResponder.panHandlers}>
      <Text style={{ fontSize: 16, fontWeight: '600', color }}>{label}</Text>
    </View>
  );
};

const createTitleStyles = (colors: ReturnType<typeof useTheme>['colors']) => {
  return StyleSheet.create({
    header: { paddingHorizontal: 16, paddingBottom: 16 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      paddingBottom: 8,
    },
    label: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
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
  });
};

const iconButtonStyles = StyleSheet.create({
  light: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220, 223, 228, 0.68)',
  },
  dark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(36, 48, 64, 0.5)',
  },
});

const styles = StyleSheet.create({
  shell: { flex: 1, paddingBottom: 16 },
  body: { flex: 1, minHeight: 0 },
  list: { flex: 1, minHeight: 0 },
  listContent: { paddingHorizontal: 16, gap: 24 },
  row: { gap: 8 },
  drop: { opacity: 0.7 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 46,
  },
});
