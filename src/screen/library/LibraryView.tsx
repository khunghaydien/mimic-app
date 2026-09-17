import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLibraryDetail } from '@/api';
import { IconButton, useTheme } from '@/ui';
import { SpeakerIcon } from '@/ui/icon';

import { QuestionAudioModal } from './QuestionAudioModal';

export function LibraryView({ libraryId }: { libraryId: string }) {
  const { t } = useTranslation();
  const { colors, mode } = useTheme();
  const styles = useMemo(() => createStyles(colors, mode), [colors, mode]);
  const detail = useLibraryDetail(libraryId);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const library = detail.data;
  const playingQuestion =
    playingIndex == null ? null : library?.questions[playingIndex];

  if (detail.isLoading) {
    return <ActivityIndicator color={colors.primary} style={styles.loading} />;
  }

  if (!library) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>{t('library.fieldTitle')}</Text>
        <Text style={styles.title}>{library.title}</Text>
      </View>

      <ScrollView
        style={styles.questionList}
        contentContainerStyle={styles.questionContent}
      >
        {library.questions.map((item, index) => (
          <View key={item.id} style={styles.questionBlock}>
            <View style={styles.questionToolbar}>
              <Text style={styles.questionLabel}>
                {t('library.questionLabel', { index: index + 1 })}
              </Text>
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
            </View>
            <Text style={styles.content}>{item.content}</Text>
            {item.hint ? <Text style={styles.hint}>{item.hint}</Text> : null}
          </View>
        ))}
      </ScrollView>

      {playingIndex != null && playingQuestion?.audioUrl ? (
        <QuestionAudioModal
          questionIndex={playingIndex + 1}
          audioUrl={playingQuestion.audioUrl}
          content={playingQuestion.content}
          hint={playingQuestion.hint}
          onClose={() => setPlayingIndex(null)}
        />
      ) : null}
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  mode: ReturnType<typeof useTheme>['mode'],
) {
  return StyleSheet.create({
    container: { flex: 1, paddingBottom: 16 },
    loading: { flex: 1 },
    header: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
    sectionLabel: { fontSize: 18, fontWeight: '700', color: colors.text },
    title: { fontSize: 16, lineHeight: 22, color: colors.text },
    questionList: { flex: 1, minHeight: 0 },
    questionContent: { paddingHorizontal: 16, gap: 24 },
    questionBlock: { gap: 8 },
    questionToolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 32,
    },
    questionLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
    content: { fontSize: 16, lineHeight: 22, color: colors.text },
    hint: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
    iconButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        mode === 'dark' ? 'rgba(36, 48, 64, 0.5)' : 'rgba(220, 223, 228, 0.68)',
    },
  });
}
