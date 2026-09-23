import { memo, useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { usePracticeList, type PracticeListItem } from '@/api';
import { AppScreen, IconButton, useTheme } from '@/ui';
import { EyeIcon } from '@/ui/icon';

import type { PracticeScreenState } from '../practiceScreenNav';

export const PracticeScreenList = memo(({
  visible,
  onScreenChange,
}: {
  visible: boolean;
  onScreenChange: (screen: PracticeScreenState) => void;
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const list = usePracticeList(visible);
  const items = useMemo(
    () => list.data?.pages.flatMap((page) => page.items) ?? [],
    [list.data],
  );

  const onView = useCallback(
    (item: PracticeListItem) =>
      onScreenChange({ status: 'result', practiceId: item.id }),
    [onScreenChange],
  );
  const renderItem = useCallback(
    ({ item }: { item: PracticeListItem }) => (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
          <IconButton label={t('library.view')} onPress={() => onView(item)}>
            <EyeIcon color={colors.text} />
          </IconButton>
        </View>
        <Text style={styles.meta}>
          {t('practice.fieldLibrary')}: {item.library}
        </Text>
        {item.score != null ? (
          <Text style={styles.meta}>
            {t('practice.score')}: {item.score}
          </Text>
        ) : null}
      </View>
    ),
    [colors.text, onView, styles, t],
  );
  const onEndReached = useCallback(() => {
    if (!list.hasNextPage || list.isFetchingNextPage) return;
    void list.fetchNextPage();
  }, [list.fetchNextPage, list.hasNextPage, list.isFetchingNextPage]);

  const loading = list.isFetching && !list.isFetchingNextPage;

  return (
    <AppScreen style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        style={styles.listContainer}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : (
            <Text style={styles.empty}>{t('practice.empty')}</Text>
          )
        }
        renderItem={renderItem}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          list.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={styles.loadingMore} />
          ) : null
        }
      />
    </AppScreen>
  );
});

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => {
  return StyleSheet.create({
    screen: { paddingBottom: 0 },
    listContainer: { flex: 1 },
    list: { paddingHorizontal: 16, gap: 12 },
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      gap: 6,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    title: {
      flex: 1,
      minWidth: 0,
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    meta: { fontSize: 13, color: colors.textMuted },
    loading: { flex: 1, marginTop: 24 },
    loadingMore: { marginVertical: 12 },
    empty: { textAlign: 'center', color: colors.textMuted, marginTop: 32 },
  });
};
