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

export function LibraryScreen({
  editingId,
  onEditingIdChange,
}: {
  editingId: string | null | undefined;
  onEditingIdChange: (id: string | null | undefined) => void;
}) {
  const { t } = useTranslation();
  const { colors, mode } = useTheme();
  const styles = useMemo(() => createListStyles(colors, mode), [colors, mode]);

  const [titleInput, setTitleInput] = useState('');
  const [appliedTitle, setAppliedTitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<LibraryListItem | null>(
    null,
  );

  const { list, remove } = useLibraryList({
    title: appliedTitle || undefined,
    limit: 20,
  });
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  if (editingId !== undefined) {
    return (
      <AppScreen style={styles.screen}>
        <LibraryForm
          libraryId={editingId}
          onClose={() => onEditingIdChange(undefined)}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen style={styles.screen}>
      <TextInput
        value={titleInput}
        onChangeText={setTitleInput}
        placeholder={t('library.searchPlaceholder')}
        placeholderTextColor={colors.text}
        style={styles.search}
        returnKeyType="search"
        onSubmitEditing={() => setAppliedTitle(titleInput.trim())}
      />

      {list.isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          style={styles.listWrap}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>{t('library.empty')}</Text>
          }
          renderItem={({ item }) => (
            <LibraryCard
              item={item}
              onOpen={() => onEditingIdChange(item.id)}
              onDelete={() => setDeleteTarget(item)}
            />
          )}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) {
              void list.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            list.isFetchingNextPage ? (
              <ActivityIndicator
                color={colors.primary}
                style={styles.loadingMore}
              />
            ) : null
          }
        />
      )}

      <View style={styles.createBar}>
        <AppButton
          label={t('library.create')}
          onPress={() => onEditingIdChange(null)}
          style={styles.create}
        />
      </View>

      <DeleteConfirm
        target={deleteTarget}
        pending={remove.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          remove.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          });
        }}
      />
    </AppScreen>
  );
}

function LibraryCard({
  item,
  onOpen,
  onDelete,
}: {
  item: LibraryListItem;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { colors, mode } = useTheme();
  const styles = useMemo(() => createCardStyles(colors, mode), [colors, mode]);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.actions}>
          <IconButton
            label={t('library.edit')}
            onPress={onOpen}
            style={styles.actionBtn}
          >
            <EditIcon color={colors.text} />
          </IconButton>
          <IconButton
            label={t('library.delete')}
            onPress={onDelete}
            style={styles.actionBtn}
          >
            <DeleteIcon color={colors.danger} />
          </IconButton>
        </View>
      </View>
      <Text style={styles.row}>
        {t('library.fieldId')}: {item.id}
      </Text>
      <Text style={styles.row}>
        {t('library.fieldCreator')}: {item.creator}
      </Text>
      <Text style={styles.row}>
        {t('library.fieldQuestions')}: {item.questionCount}
      </Text>
      <Text style={styles.row}>
        {t('library.fieldCreated')}: {formatDate(item.createdAt)}
      </Text>
      <Text style={styles.row}>
        {t('library.fieldUpdated')}: {formatDate(item.updatedAt)}
      </Text>
    </View>
  );
}

function DeleteConfirm({
  target,
  pending,
  onCancel,
  onConfirm,
}: {
  target: LibraryListItem | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const { colors, mode } = useTheme();
  const styles = useMemo(
    () => createConfirmStyles(colors, mode),
    [colors, mode],
  );

  return (
    <Modal
      visible={target != null}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('library.deleteConfirmTitle')}</Text>
          <Text style={styles.text}>
            {t('library.deleteConfirm', { title: target?.title ?? '' })}
          </Text>
          <View style={styles.actions}>
            <AppButton
              label={t('library.cancel')}
              onPress={onCancel}
              disabled={pending}
              style={styles.cancel}
              labelStyle={styles.cancelLabel}
            />
            <AppButton
              label={t('library.delete')}
              onPress={onConfirm}
              disabled={pending}
              style={styles.delete}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function cardBg(mode: ReturnType<typeof useTheme>['mode']) {
  return mode === 'dark' ? '#1A222C' : '#FFFFFF';
}

function createListStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  mode: ReturnType<typeof useTheme>['mode'],
) {
  return StyleSheet.create({
    screen: {
      paddingBottom: 0,
    },
    search: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: cardBg(mode),
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    createBar: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
    },
    create: {
      alignSelf: 'stretch',
      minWidth: undefined,
    },
    loading: {
      flex: 1,
      marginTop: 24,
    },
    loadingMore: {
      marginVertical: 12,
    },
    listWrap: {
      flex: 1,
    },
    list: {
      paddingHorizontal: 16,
      gap: 12,
    },
    empty: {
      textAlign: 'center',
      color: colors.textMuted,
      marginTop: 32,
    },
  });
}

function createCardStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  mode: ReturnType<typeof useTheme>['mode'],
) {
  return StyleSheet.create({
    card: {
      backgroundColor: cardBg(mode),
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      gap: 6,
    },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    title: {
      flex: 1,
      minWidth: 0,
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    actionBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: mode === 'dark' ? '#243040' : '#F0F2F5',
    },
    row: {
      fontSize: 13,
      color: colors.textMuted,
    },
  });
}

function createConfirmStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  mode: ReturnType<typeof useTheme>['mode'],
) {
  const surface = cardBg(mode);
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      backgroundColor: surface,
      borderRadius: 12,
      padding: 16,
      gap: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    text: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    cancel: {
      flex: 1,
      minWidth: undefined,
      backgroundColor: surface,
      borderColor: colors.border,
    },
    cancelLabel: {
      color: colors.text,
    },
    delete: {
      flex: 1,
      minWidth: undefined,
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
  });
}
