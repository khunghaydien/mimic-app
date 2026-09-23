import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { LibraryScreenCreate } from './component/LibraryScreenCreate';
import { LibraryScreenList } from './component/LibraryScreenList';
import { LibraryScreenUpdate } from './component/LibraryScreenUpdate';
import { LibraryScreenView } from './component/LibraryScreenView';
import type { LibraryScreenState } from './libraryScreenNav';

export const LibraryScreen = ({
  visible,
  screen,
  onScreenChange,
  onPlay,
}: {
  visible: boolean;
  screen: LibraryScreenState;
  onScreenChange: (screen: LibraryScreenState) => void;
  onPlay: (libraryId: string) => void;
}) => {
  const libraryId = 'libraryId' in screen ? screen.libraryId : '';
  const onClose = useCallback(
    () => onScreenChange({ status: 'list' }),
    [onScreenChange],
  );
  const onPlayPress = useCallback(
    () => onPlay(libraryId),
    [libraryId, onPlay],
  );
  const onEdit = useCallback(
    () => onScreenChange({ status: 'update', libraryId, from: 'view' }),
    [libraryId, onScreenChange],
  );

  const listHidden = screen.status !== 'list';
  const viewOpen =
    screen.status === 'view' ||
    (screen.status === 'update' && screen.from === 'view');
  const viewHidden = screen.status !== 'view';

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
      {viewOpen ? (
        <View
          key={libraryId}
          style={[styles.overlay, viewHidden && styles.hidden]}
          pointerEvents={viewHidden ? 'none' : 'auto'}
        >
          <LibraryScreenView
            libraryId={libraryId}
            onPlay={onPlayPress}
            onEdit={onEdit}
          />
        </View>
      ) : null}
      {screen.status === 'create' ? (
        <View style={styles.overlay}>
          <LibraryScreenCreate onClose={onClose} />
        </View>
      ) : null}
      {screen.status === 'update' ? (
        <View style={styles.overlay}>
          <LibraryScreenUpdate libraryId={libraryId} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  hidden: { display: 'none' },
});
