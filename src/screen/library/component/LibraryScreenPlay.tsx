import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { getDocumentAsync } from 'expo-document-picker';

import { useCreateAnswer, useCreatePractice, useLibrary } from '@/api';
import { AppButton, AppScreen, IconButton, useTheme } from '@/ui';
import { PauseIcon, PlayIcon } from '@/ui/icon';

import { LibraryIconButton } from './LibraryLayoutForm';

type AnswerFile = {
  uri: string;
  name: string;
  type?: string;
};

export const LibraryScreenPlayButton = ({ onPress }: { onPress: () => void }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <LibraryIconButton label={t('library.playAudio')} onPress={onPress}>
      <PlayIcon color={colors.primary} />
    </LibraryIconButton>
  );
};

export const LibraryScreenPlay = ({
  libraryId,
  onClose,
}: {
  libraryId: string;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const library = useLibrary(libraryId);
  const createPractice = useCreatePractice();
  const createAnswer = useCreateAnswer();
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answer, setAnswer] = useState<AnswerFile | null>(null);
  const [practiceId, setPracticeId] = useState<string | null>(null);
  const questions = library.data?.questions ?? [];
  const question = questions[index];

  useEffect(() => {
    let cancelled = false;
    void createPractice.mutateAsync(libraryId).then((practice) => {
      if (!cancelled) setPracticeId(practice.id);
    });
    return () => {
      cancelled = true;
    };
  }, [libraryId]);

  useEffect(() => {
    setFinished(false);
    setAnswer(null);
  }, [index]);

  if (!library.data || !question) {
    return (
      <AppScreen style={styles.screen}>
        {library.isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : null}
      </AppScreen>
    );
  }

  const canAnswer = !question.audioUrl || finished;
  const onPickAudio = async () => {
    const result = await getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled) return;
    const file = result.assets[0];
    setAnswer({
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    });
  };
  const onSubmit = async () => {
    if (!answer) return;
    const sessionId = practiceId
      ? practiceId
      : (await createPractice.mutateAsync(libraryId)).id;
    if (!practiceId) setPracticeId(sessionId);
    await createAnswer.mutateAsync({
      uri: answer.uri,
      name: answer.name,
      type: answer.type,
      practiceId: sessionId,
      questionId: question.id,
    });
    if (index >= questions.length - 1) {
      onClose();
      return;
    }
    setIndex(index + 1);
  };

  return (
    <AppScreen style={styles.screen}>
      <View style={styles.body}>
        <Text style={styles.title}>
          {t('library.questionLabel', { index: index + 1 })}
        </Text>
        {question.audioUrl ? (
          <QuestionAudio
            key={question.id}
            audioUrl={question.audioUrl}
            styles={styles}
            onFinished={() => setFinished(true)}
          />
        ) : null}
        <Text style={styles.content}>{question.content}</Text>
        {question.hint ? <Text style={styles.hint}>{question.hint}</Text> : null}
        {answer ? (
          <Text style={styles.picked} numberOfLines={1} onPress={() => void onPickAudio()}>
            {t('library.pickedAudio', { name: answer.name })}
          </Text>
        ) : null}
      </View>
      <View style={styles.bar}>
        {answer ? (
          <AppButton
            label={t('library.submit')}
            onPress={onSubmit}
            disabled={!practiceId}
            style={styles.barButton}
          />
        ) : (
          <AppButton
            label={t('library.pickAudio')}
            onPress={() => void onPickAudio()}
            disabled={!canAnswer}
            style={styles.barButton}
          />
        )}
      </View>
    </AppScreen>
  );
};

const QuestionAudio = ({
  audioUrl,
  styles,
  onFinished,
}: {
  audioUrl: string;
  styles: ReturnType<typeof createStyles>;
  onFinished: () => void;
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const player = useAudioPlayer(
    `${process.env.EXPO_PUBLIC_CLOUDFLARE_PUBLIC_URL?.replace(/\/$/, '')}/${audioUrl.replace(/^\//, '')}`,
    { updateInterval: 1000 },
  );
  const status = useAudioPlayerStatus(player);
  const playing = status.playing && !status.didJustFinish;

  useLayoutEffect(() => () => player.pause(), [player]);

  useEffect(() => {
    let cancelled = false;
    void setAudioModeAsync({ playsInSilentMode: true }).then(() => {
      if (!cancelled) player.play();
    });
    return () => {
      cancelled = true;
    };
  }, [player]);

  useEffect(() => {
    if (status.didJustFinish) onFinished();
  }, [onFinished, status.didJustFinish]);

  return (
    <MediaRow
      label={playing ? t('library.pauseAudio') : t('library.playAudio')}
      icon={
        playing ? (
          <PauseIcon color={colors.primary} />
        ) : (
          <PlayIcon color={colors.primary} />
        )
      }
      time={`${formatTime(status.currentTime)} / ${formatTime(status.duration)}`}
      styles={styles}
      onPress={() => {
        if (playing) {
          player.pause();
          return;
        }
        if (status.didJustFinish) player.seekTo(0);
        player.play();
      }}
    >
      <AudioBars playing={playing} color={colors.primary} />
    </MediaRow>
  );
};

const MediaRow = ({
  label,
  icon,
  time,
  styles,
  onPress,
  children,
}: {
  label: string;
  icon: ReactNode;
  time: string;
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
  children: ReactNode;
}) => {
  return (
    <View style={styles.audioRow}>
      <IconButton label={label} onPress={onPress} style={styles.playButton}>
        {icon}
      </IconButton>
      {children}
      <Text style={styles.time}>{time}</Text>
    </View>
  );
};

const AudioBars = ({ color, playing = false }: { color: string; playing?: boolean }) => {
  const bars = useMemo(
    () => BAR_SCALES.map((scale) => new Animated.Value(scale)),
    [],
  );

  useEffect(() => {
    if (!playing) {
      bars.forEach((bar, index) => bar.setValue(BAR_SCALES[index]));
      return;
    }
    const waves = bars.map((bar, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: Math.min(1, BAR_SCALES[index] + 0.25),
            duration: 320 + index * 40,
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: Math.max(0.33, BAR_SCALES[index] - 0.25),
            duration: 320 + index * 40,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    waves.forEach((wave) => wave.start());
    return () => waves.forEach((wave) => wave.stop());
  }, [playing, bars]);

  return (
    <View style={barStyles.row}>
      {bars.map((bar, index) => (
        <Animated.View
          key={index}
          style={[
            barStyles.bar,
            { backgroundColor: color, transform: [{ scaleY: bar }] },
          ]}
        />
      ))}
    </View>
  );
};

const BAR_HEIGHTS = [8, 12, 16, 20, 24, 20, 16, 12, 8];
const BAR_SCALES = BAR_HEIGHTS.map((height) => height / 24);

const formatTime = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

const barStyles = StyleSheet.create({
  row: {
    width: 60,
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  bar: { width: 4, height: 24, borderRadius: 2 },
});

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => {
  return StyleSheet.create({
    screen: { paddingBottom: 0 },
    loading: { flex: 1 },
    body: { flex: 1, paddingHorizontal: 16, gap: 12 },
    title: { fontSize: 18, fontWeight: '700', color: colors.text },
    audioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    time: { marginLeft: 'auto', fontSize: 12, color: colors.textMuted },
    playButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.border,
    },
    content: { fontSize: 16, fontWeight: '600', color: colors.text, lineHeight: 22 },
    hint: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    picked: { fontSize: 13, color: colors.textMuted },
    bar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
    barButton: { alignSelf: 'stretch', minWidth: undefined },
  });
};
