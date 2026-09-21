import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLibrary } from '@/api';
import { AppScreen, useTheme } from '@/ui';

import { LibraryModalQuestionViewButton } from './LibraryModalQuestionView';

export const LibraryScreenView = ({ libraryId }: { libraryId: string }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>{t('library.fieldTitle')}</Text>
          <Text style={styles.title}>{library.data.title}</Text>
        </View>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {library.data.questions.map((question, index) => (
            <View key={question.id} style={styles.row}>
              <View style={styles.toolbar}>
                <Text style={styles.label}>
                  {t('library.questionLabel', { index: index + 1 })}
                </Text>
                <LibraryModalQuestionViewButton
                  questionIndex={index + 1}
                  audioUrl={question.audioUrl}
                  content={question.content}
                  hint={question.hint}
                />
              </View>
              <Text style={styles.content}>{question.content}</Text>
              <Text style={styles.hint}>{question.hint}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </AppScreen>
  );
};

const screenStyle = { paddingBottom: 0 };
const loadingStyle = { flex: 1 };

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => {
  return StyleSheet.create({
    container: { flex: 1, paddingBottom: 16 },
    header: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
    sectionLabel: { fontSize: 18, fontWeight: '700', color: colors.text },
    title: { fontSize: 16, lineHeight: 22, color: colors.text },
    list: { flex: 1, minHeight: 0 },
    listContent: { paddingHorizontal: 16, gap: 24 },
    row: { gap: 8 },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 32,
    },
    label: { fontSize: 16, fontWeight: '600', color: colors.text },
    content: { fontSize: 16, lineHeight: 22, color: colors.text },
    hint: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  });
};
