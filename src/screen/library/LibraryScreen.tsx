import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { useLibraryList, type LibraryListItem } from '@/api';
import { AppButton, AppScreen, IconButton, useTheme } from '@/ui';
import { EditIcon, DeleteIcon } from '@/ui/icon';

import { LibraryForm } from './LibraryForm';

export type LibraryFormState =
  | { status: 'list' }
  | { status: 'create' }
  | { status: 'edit'; libraryId: string };

export function LibraryScreen({
  form,
  onFormChange,
}: {
  form: LibraryFormState;
  onFormChange: (form: LibraryFormState) => void;
}) {
  const { t } = useTranslation();
  const { colors, mode } = useTheme();
  const styles = useMemo(() => createStyles(colors, mode), [colors, mode]);
  const [searchText, setSearchText] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [libraryToDelete, setLibraryToDelete] = useState<LibraryListItem | null>(
    null,
  );
  const { list, remove } = useLibraryList(appliedSearch || undefined);
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  if (form.status !== 'list') {
    return (
      <AppScreen style={styles.screen}>
        <LibraryForm
          libraryId={form.status === 'edit' ? form.libraryId : null}
          onClose={() => onFormChange({ status: 'list' })}
        />
      </AppScreen>
    );
  }

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
          list.isFetching && !list.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : (
            <Text style={styles.empty}>{t('library.empty')}</Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.actions}>
                <IconButton
                  label={t('library.edit')}
                  onPress={() =>
                    onFormChange({ status: 'edit', libraryId: item.id })
                  }
                  style={styles.iconButton}
                >
                  <EditIcon color={colors.text} />
                </IconButton>
                <IconButton
                  label={t('library.delete')}
                  onPress={() => setLibraryToDelete(item)}
                  style={styles.iconButton}
                >
                  <DeleteIcon color={colors.danger} />
                </IconButton>
              </View>
            </View>
            <Text style={styles.meta}>
              {t('library.fieldId')}: {item.id}
            </Text>
            <Text style={styles.meta}>
              {t('library.fieldCreator')}: {item.creator}
            </Text>
            <Text style={styles.meta}>
              {t('library.fieldQuestions')}: {item.questionCount}
            </Text>
            <Text style={styles.meta}>
              {t('library.fieldCreated')}: {new Date(item.createdAt).toLocaleString()}
            </Text>
            <Text style={styles.meta}>
              {t('library.fieldUpdated')}: {new Date(item.updatedAt).toLocaleString()}
            </Text>
          </View>
        )}
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
        }}
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
          onPress={() => onFormChange({ status: 'create' })}
          style={styles.create}
        />
      </View>

      <Modal
        visible={libraryToDelete != null}
        transparent
        animationType="fade"
        onRequestClose={() => setLibraryToDelete(null)}
      >
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setLibraryToDelete(null)}
          />
          <View style={styles.sheet}>
            <Text style={styles.confirmTitle}>{t('library.deleteConfirmTitle')}</Text>
            <Text style={styles.confirmText}>
              {t('library.deleteConfirm', { title: libraryToDelete?.title })}
            </Text>
            <View style={styles.confirmActions}>
              <AppButton
                label={t('library.cancel')}
                onPress={() => setLibraryToDelete(null)}
                style={styles.cancel}
                labelStyle={styles.cancelLabel}
              />
              <AppButton
                label={t('library.delete')}
                onPress={() => {
                  if (!libraryToDelete) return;
                  remove.mutate(libraryToDelete.id, {
                    onSuccess: () => setLibraryToDelete(null),
                  });
                }}
                style={styles.delete}
              />
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  mode: ReturnType<typeof useTheme>['mode'],
) {
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
    card: {
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      gap: 6,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    cardTitle: {
      flex: 1,
      minWidth: 0,
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    iconButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: mode === 'dark' ? '#243040' : '#F0F2F5',
    },
    meta: { fontSize: 13, color: colors.textMuted },
    overlay: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: { backgroundColor: surface, borderRadius: 12, padding: 16, gap: 12 },
    confirmTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    confirmText: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    confirmActions: { flexDirection: 'row', gap: 8 },
    cancel: {
      flex: 1,
      minWidth: undefined,
      backgroundColor: surface,
      borderColor: colors.border,
    },
    cancelLabel: { color: colors.text },
    delete: {
      flex: 1,
      minWidth: undefined,
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
  });
}
