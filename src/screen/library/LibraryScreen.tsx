import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { LibraryScreenCreate } from './component/LibraryScreenCreate';
import { LibraryScreenList } from './component/LibraryScreenList';
import { LibraryScreenUpdate } from './component/LibraryScreenUpdate';
import { LibraryScreenView } from './component/LibraryScreenView';

export type LibraryScreenState =
  | { status: 'list' }
  | { status: 'create' }
  | { status: 'update'; libraryId: string }
  | { status: 'view'; libraryId: string };

export const LibraryScreen = memo(({
  visible,
  screen,
  onScreenChange,
}: {
  visible: boolean;
  screen: LibraryScreenState;
  onScreenChange: (screen: LibraryScreenState) => void;
}) => {
  const onClose = useCallback(
    () => onScreenChange({ status: 'list' }),
    [onScreenChange],
  );
  const libraryId = 'libraryId' in screen ? screen.libraryId : '';
  const listHidden = {
    list: false,
    create: true,
    update: true,
    view: true,
  }[screen.status];
  const overlay = {
    list: () => null,
    create: () => <LibraryScreenCreate onClose={onClose} />,
    update: () => <LibraryScreenUpdate libraryId={libraryId} />,
    view: () => <LibraryScreenView libraryId={libraryId} />,
  }[screen.status]();

  return (
    <View style={styles.fill}>
      <View
        style={[styles.fill, listHidden && styles.hidden]}
        pointerEvents={listHidden ? 'none' : 'auto'}
      >
        <LibraryScreenList
          visible={visible && !listHidden}
          onScreenChange={onScreenChange}
        />
      </View>
      {overlay}
    </View>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hidden: { display: 'none' },
});
