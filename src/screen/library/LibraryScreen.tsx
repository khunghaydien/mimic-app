import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { LibraryScreenCreate } from './component/LibraryScreenCreate';
import { LibraryScreenList } from './component/LibraryScreenList';
import { LibraryScreenPlay } from './component/LibraryScreenPlay';
import { LibraryScreenUpdate } from './component/LibraryScreenUpdate';
import { LibraryScreenView } from './component/LibraryScreenView';
import type { LibraryScreenState } from './libraryScreenNav';

export type { LibraryScreenState } from './libraryScreenNav';
export { popLibraryScreen, resetLibraryScreen } from './libraryScreenNav';

export const LibraryScreen = ({
  visible,
  screen,
  onScreenChange,
}: {
  visible: boolean;
  screen: LibraryScreenState;
  onScreenChange: (screen: LibraryScreenState) => void;
}) => {
  const libraryId = 'libraryId' in screen ? screen.libraryId : '';
  const onClose = useCallback(
    () => onScreenChange({ status: 'list' }),
    [onScreenChange],
  );
  const onPlay = useCallback(
    () => onScreenChange({ status: 'play', libraryId }),
    [libraryId, onScreenChange],
  );
  const onEdit = useCallback(
    () => onScreenChange({ status: 'update', libraryId, from: 'view' }),
    [libraryId, onScreenChange],
  );
  const onPlayClose = useCallback(
    () => onScreenChange({ status: 'view', libraryId }),
    [libraryId, onScreenChange],
  );

  const listHidden = screen.status !== 'list';
  const viewOpen =
    screen.status === 'view' ||
    screen.status === 'play' ||
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
            onPlay={onPlay}
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
      {screen.status === 'play' ? (
        <View style={styles.overlay}>
          <LibraryScreenPlay libraryId={libraryId} onClose={onPlayClose} />
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
