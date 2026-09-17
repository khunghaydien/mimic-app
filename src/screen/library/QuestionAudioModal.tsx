import { useEffect, useMemo } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { IconButton, useTheme } from '@/ui';
import { CloseIcon, PauseIcon, PlayIcon } from '@/ui/icon';

export function QuestionAudioModal({
  questionIndex,
  audioUrl,
  content,
  hint,
  onClose,
}: {
  questionIndex: number;
  audioUrl: string;
  content: string;
  hint: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { colors, mode } = useTheme();
  const styles = useMemo(() => createStyles(colors, mode), [colors, mode]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {t('library.audioTitle', { index: questionIndex })}
            </Text>
            <IconButton label={t('library.close')} onPress={onClose}>
              <CloseIcon color={colors.text} />
            </IconButton>
          </View>
          <AudioPlayer audioUrl={audioUrl} styles={styles} />
          <Text style={styles.content}>{content}</Text>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

function AudioPlayer({
  audioUrl,
  styles,
}: {
  audioUrl: string;
  styles: ReturnType<typeof createStyles>;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const player = useAudioPlayer(
    `${process.env.EXPO_PUBLIC_CLOUDFLARE_PUBLIC_URL}${audioUrl}`,
    { updateInterval: 1000 },
  );
  const status = useAudioPlayerStatus(player);
  const playing = status.playing && !status.didJustFinish;

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true }).then(() => player.play());
    return () => player.pause();
  }, [player]);

  const onTogglePlay = () => {
    if (playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish) player.seekTo(0);
    player.play();
  };

  return (
    <View style={styles.audioRow}>
      <IconButton
        label={playing ? t('library.pauseAudio') : t('library.playAudio')}
        onPress={onTogglePlay}
        style={styles.playButton}
      >
        {playing ? (
          <PauseIcon color={colors.primary} />
        ) : (
          <PlayIcon color={colors.primary} />
        )}
      </IconButton>
      <AudioBars playing={playing} color={colors.primary} />
      <Text style={styles.time}>
        {formatTime(status.currentTime)} / {formatTime(status.duration)}
      </Text>
    </View>
  );
}

function AudioBars({ playing, color }: { playing: boolean; color: string }) {
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
}

const BAR_HEIGHTS = [8, 12, 16, 20, 24, 20, 16, 12, 8];
const BAR_SCALES = BAR_HEIGHTS.map((height) => height / 24);

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

function formatTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  mode: ReturnType<typeof useTheme>['mode'],
) {
  const surface = mode === 'dark' ? '#1A222C' : '#FFFFFF';
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: { backgroundColor: surface, borderRadius: 12, padding: 16, gap: 12 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    title: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
    audioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    time: { marginLeft: 'auto', fontSize: 12, color: colors.textMuted },
    playButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: mode === 'dark' ? 'rgba(36, 48, 64, 0.5)' : 'rgba(220, 223, 228, 0.68)',
    },
    content: { fontSize: 16, fontWeight: '600', color: colors.text, lineHeight: 22 },
    hint: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  });
}
