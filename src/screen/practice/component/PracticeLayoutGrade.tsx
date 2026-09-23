import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';

import type { Practice, PracticeAnswer } from '@/api';
import { useTheme } from '@/ui';
import { CaptionIcon, PauseIcon, PlayIcon } from '@/ui/icon';

type GradeError = {
  original: string;
  correction: string;
  explanation: string;
};

type GradePart = {
  score: number;
  comment: string;
};

type GradeView = GradePart & {
  relevance: GradePart;
  vocabulary: GradePart & { strengths: string[]; improvements: string[] };
  grammar: GradePart & { errors: GradeError[] };
  completeness: GradePart & { missing: string[] };
};

export const PracticeLayoutGrade = ({
  answers,
}: {
  answers: Practice['answers'];
}) => {
  return (
    <>
      {answers.map((answer, index) => (
        <AnswerItem key={answer.id} answer={answer} index={index} />
      ))}
    </>
  );
};

const AnswerItem = ({
  answer,
  index,
}: {
  answer: PracticeAnswer;
  index: number;
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [open, setOpen] = useState<'caption' | 'score' | null>(null);
  const grade = answer.grade as unknown as GradeView | undefined;
  const toggle = (panel: 'caption' | 'score') =>
    setOpen((current) => (current === panel ? null : panel));

  return (
    <View style={styles.row}>
      <View style={styles.headerRow}>
        <View style={styles.headerMain}>
          <Text style={styles.label}>
            {t('library.questionLabel', { index: index + 1 })}
          </Text>
          {answer.question ? <Text style={styles.content}>{answer.question}</Text> : null}
        </View>
        <View style={styles.actions}>
          {answer.audioUrl ? <AnswerAudio url={answer.audioUrl} /> : null}
          <CircleButton
            label={t('library.gradeCaption')}
            onPress={() => toggle('caption')}
          >
            <CaptionIcon color={colors.primary} size={16} />
          </CircleButton>
          <CircleButton
            label={t('practice.score')}
            onPress={() => toggle('score')}
          >
            <Text style={styles.scoreValue}>{grade ? grade.score : '–'}</Text>
          </CircleButton>
        </View>
      </View>
      {open === 'caption' && answer.caption ? (
        <Text style={styles.hint}>{answer.caption}</Text>
      ) : null}
      {open === 'score' && grade ? <GradeDetail grade={grade} styles={styles} /> : null}
    </View>
  );
};

const AnswerAudio = ({ url }: { url: string }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const player = useAudioPlayer(url, { updateInterval: 1000 });
  const status = useAudioPlayerStatus(player);
  const playing = status.playing && !status.didJustFinish;

  useLayoutEffect(() => () => player.pause(), [player]);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  return (
    <CircleButton
      label={playing ? t('library.pauseAudio') : t('library.playAudio')}
      onPress={() => {
        if (playing) {
          player.pause();
          return;
        }
        if (status.didJustFinish) player.seekTo(0);
        player.play();
      }}
    >
      {playing ? (
        <PauseIcon color={colors.primary} size={16} />
      ) : (
        <PlayIcon color={colors.primary} size={16} />
      )}
    </CircleButton>
  );
};

const CircleButton = ({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) => {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[circleStyles.button, { backgroundColor: colors.border }]}
    >
      {children}
    </Pressable>
  );
};

const GradeDetail = ({
  grade,
  styles,
}: {
  grade: GradeView;
  styles: ReturnType<typeof createStyles>;
}) => {
  const { t } = useTranslation();
  const errors = (grade.grammar?.errors ?? []).flatMap((error) => {
    if (typeof error === 'string') {
      return [{ original: error, correction: '', explanation: '' }];
    }
    return [error];
  });
  return (
    <>
      {grade.comment ? <Text style={styles.hint}>{grade.comment}</Text> : null}
      <GradeScore label={t('library.gradeRelevance')} item={grade.relevance} styles={styles} />
      <GradeScore
        label={t('library.gradeVocabulary')}
        item={grade.vocabulary}
        notes={[
          { title: t('library.gradeStrengths'), values: grade.vocabulary?.strengths ?? [] },
          { title: t('library.gradeImprovements'), values: grade.vocabulary?.improvements ?? [] },
        ]}
        styles={styles}
      />
      <GradeScore label={t('library.gradeGrammar')} item={grade.grammar} styles={styles} />
      {errors.map((error, index) => (
        <View key={`${error.original}-${index}`}>
          <Text style={styles.hint}>
            {t('library.gradeOriginal')}: {error.original}
          </Text>
          <Text style={styles.hint}>
            {t('library.gradeCorrection')}: {error.correction}
          </Text>
          <Text style={styles.hint}>
            {t('library.gradeExplanation')}: {error.explanation}
          </Text>
        </View>
      ))}
      <GradeScore
        label={t('library.gradeCompleteness')}
        item={grade.completeness}
        notes={[{ title: t('library.gradeMissing'), values: grade.completeness?.missing ?? [] }]}
        styles={styles}
      />
    </>
  );
};

const GradeScore = ({
  label,
  item,
  notes = [],
  styles,
}: {
  label: string;
  item?: GradePart;
  notes?: { title: string; values: string[] }[];
  styles: ReturnType<typeof createStyles>;
}) => {
  if (!item) return null;
  return (
    <View>
      <Text style={styles.score}>
        {label}: {item.score}
      </Text>
      {item.comment ? <Text style={styles.hint}>{item.comment}</Text> : null}
      {notes.map((note) =>
        note.values.length ? (
          <View key={note.title}>
            <Text style={styles.hint}>{note.title}</Text>
            {note.values.map((value) => (
              <Text key={value} style={styles.hint}>
                • {value}
              </Text>
            ))}
          </View>
        ) : null,
      )}
    </View>
  );
};

const circleStyles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => {
  return StyleSheet.create({
    row: { gap: 8 },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    headerMain: { flex: 1, minWidth: 0, gap: 2 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    label: { fontSize: 16, fontWeight: '600', color: colors.text },
    content: { fontSize: 16, lineHeight: 22, color: colors.text },
    hint: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
    score: { fontSize: 14, fontWeight: '600', color: colors.text },
    scoreValue: { fontSize: 11, fontWeight: '700', color: colors.primary },
  });
};
