import { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { canManageLibrary, useAuth, useLibraryList, type Library } from '@/api';
import { AppButton, AppScreen, useTheme } from '@/ui';

import { LibraryLayoutCardManage, LibraryLayoutCardView } from './LibraryLayoutCard';
import type { LibraryScreenState } from '../LibraryScreen';

export const LibraryScreenList = memo(({
  visible,
  onScreenChange,
}: {
  visible: boolean;
  onScreenChange: (screen: LibraryScreenState) => void;
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { colors, mode } = useTheme();
  const styles = useMemo(() => createStyles(colors, mode), [colors, mode]);
  const [searchText, setSearchText] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const list = useLibraryList(appliedSearch || undefined, visible);
  const items = useMemo(
    () => list.data?.pages.flatMap((page) => page.items) ?? [],
    [list.data],
  );

  const onUpdate = useCallback(
    (item: Library) => onScreenChange({ status: 'update', libraryId: item.id }),
    [onScreenChange],
  );
  const onView = useCallback(
    (item: Library) => onScreenChange({ status: 'view', libraryId: item.id }),
    [onScreenChange],
  );
  const renderItem = useCallback(
    ({ item }: { item: Library }) =>
      canManageLibrary(item.creator, user!) ? (
        <LibraryLayoutCardManage item={item} onUpdate={onUpdate} />
      ) : (
        <LibraryLayoutCardView item={item} onView={onView} />
      ),
    [user, onUpdate, onView],
  );
  const onEndReached = useCallback(() => {
    if (!list.hasNextPage || list.isFetchingNextPage) return;
    void list.fetchNextPage();
  }, [list.fetchNextPage, list.hasNextPage, list.isFetchingNextPage]);

  const loading = list.isFetching && !list.isFetchingNextPage;

  return (
    <AppScreen style={styles.screen}>
      <TextInput
        value={searchText}
        onChangeText={setSearchText}
        placeholder={t('library.searchPlaceholder')}
        placeholderTextColor={colors.text}
        style={styles.search}
        returnKeyType="search"
        onSubmitEditing={() => setAppliedSearch(searchText.trim())}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        style={styles.listContainer}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : (
            <Text style={styles.empty}>{t('library.empty')}</Text>
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

      <View style={styles.createBar}>
        <AppButton
          label={t('library.create')}
          onPress={() => onScreenChange({ status: 'create' })}
          style={styles.create}
        />
      </View>
    </AppScreen>
  );
});

const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  mode: ReturnType<typeof useTheme>['mode'],
) => {
  const surface = mode === 'dark' ? '#1A222C' : '#FFFFFF';
  return StyleSheet.create({
    screen: { paddingBottom: 0 },
    search: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: surface,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    createBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
    create: { alignSelf: 'stretch', minWidth: undefined },
    loading: { flex: 1, marginTop: 24 },
    loadingMore: { marginVertical: 12 },
    listContainer: { flex: 1 },
    list: { paddingHorizontal: 16, gap: 12 },
    empty: { textAlign: 'center', color: colors.textMuted, marginTop: 32 },
  });
};
