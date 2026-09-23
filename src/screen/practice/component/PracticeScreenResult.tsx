import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useGradePractice, usePractice } from '@/api';
import { AppButton, AppScreen, useTheme } from '@/ui';

import { PracticeLayoutGrade } from './PracticeLayoutGrade';

export const PracticeScreenResult = ({ practiceId }: { practiceId: string }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const practice = usePractice(practiceId);
  const gradePractice = useGradePractice();
  const answers = practice.data?.answers ?? [];
  const canGrade = answers.length > 0 && answers.some((item) => !item.grade);

  if (!practice.data) {
    return (
      <AppScreen style={screenStyle}>
        {practice.isLoading ? (
          <ActivityIndicator color={colors.primary} style={loadingStyle} />
        ) : null}
      </AppScreen>
    );
  }

  return (
    <AppScreen style={screenStyle}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>{t('practice.fieldLibrary')}</Text>
          <Text style={styles.title}>{practice.data.library}</Text>
        </View>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          <PracticeLayoutGrade answers={answers} />
        </ScrollView>
        {canGrade ? (
          <AppButton
            label={t('library.grade')}
            onPress={() => gradePractice.mutate(practiceId)}
            style={styles.barButton}
          />
        ) : null}
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
    barButton: { alignSelf: 'stretch', minWidth: undefined, marginHorizontal: 16 },
  });
};
