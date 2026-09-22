import { memo, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useDeleteLibrary, type LibraryListItem } from '@/api';
import { ConfirmModal, useTheme } from '@/ui';
import { DeleteIcon, EditIcon, EyeIcon } from '@/ui/icon';

import { LibraryIconButton } from './LibraryLayoutForm';

const LibraryLayoutCard = memo(({
  item,
  actions,
}: {
  item: LibraryListItem;
  actions: ReactNode;
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fields = useMemo(
    () =>
      Object.entries(item).filter(
        ([key, value]) => key !== 'title' && (value == null || typeof value !== 'object'),
      ),
    [item],
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.actions}>{actions}</View>
      </View>
      {fields.map(([label, value]) => (
        <Text key={label} style={styles.meta}>
          {label}: {String(value)}
        </Text>
      ))}
    </View>
  );
});

export const LibraryLayoutCardManage = memo(({
  item,
  onView,
  onUpdate,
}: {
  item: LibraryListItem;
  onView: (item: LibraryListItem) => void;
  onUpdate: (item: LibraryListItem) => void;
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <LibraryLayoutCard
      item={item}
      actions={
        <>
          <LibraryIconButton label={t('library.view')} onPress={() => onView(item)}>
            <EyeIcon color={colors.text} />
          </LibraryIconButton>
          <LibraryIconButton label={t('library.edit')} onPress={() => onUpdate(item)}>
            <EditIcon color={colors.text} />
          </LibraryIconButton>
          <DeleteLibraryButton libraryId={item.id} title={item.title} />
        </>
      }
    />
  );
});

export const LibraryLayoutCardView = memo(({
  item,
  onView,
}: {
  item: LibraryListItem;
  onView: (item: LibraryListItem) => void;
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <LibraryLayoutCard
      item={item}
      actions={
        <LibraryIconButton label={t('library.view')} onPress={() => onView(item)}>
          <EyeIcon color={colors.text} />
        </LibraryIconButton>
      }
    />
  );
});

const DeleteLibraryButton = ({ libraryId, title }: { libraryId: string; title: string }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const remove = useDeleteLibrary();
  const [open, setOpen] = useState(false);

  return (
    <>
      <LibraryIconButton label={t('library.delete')} onPress={() => setOpen(true)}>
        <DeleteIcon color={colors.danger} />
      </LibraryIconButton>
      {open ? (
        <ConfirmModal
          title={t('library.deleteConfirmTitle')}
          message={t('library.deleteConfirm', { title })}
          cancelLabel={t('library.cancel')}
          confirmLabel={t('library.delete')}
          onClose={() => setOpen(false)}
          onConfirm={() => remove.mutate(libraryId, { onSuccess: () => setOpen(false) })}
        />
      ) : null}
    </>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => {
  return StyleSheet.create({
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
    actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    meta: { fontSize: 13, color: colors.textMuted },
  });
};
