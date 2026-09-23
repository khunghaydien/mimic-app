import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { PracticeScreenList } from './component/PracticeScreenList';
import { PracticeScreenPlay } from './component/PracticeScreenPlay';
import { PracticeScreenResult } from './component/PracticeScreenResult';
import type { PracticeScreenState } from './practiceScreenNav';

export const PracticeScreen = ({
  visible,
  screen,
  onScreenChange,
}: {
  visible: boolean;
  screen: PracticeScreenState;
  onScreenChange: (screen: PracticeScreenState) => void;
}) => {
  const onGraded = useCallback(
    (practiceId: string) => onScreenChange({ status: 'result', practiceId }),
    [onScreenChange],
  );

  const listHidden = screen.status !== 'list';

  return (
    <View style={styles.fill}>
      <View
        style={[styles.fill, listHidden && styles.hidden]}
        pointerEvents={listHidden ? 'none' : 'auto'}
      >
        <PracticeScreenList
          visible={visible && !listHidden}
          onScreenChange={onScreenChange}
        />
      </View>
      {screen.status === 'play' ? (
        <View style={styles.overlay}>
          <PracticeScreenPlay libraryId={screen.libraryId} onGraded={onGraded} />
        </View>
      ) : null}
      {screen.status === 'result' ? (
        <View style={styles.overlay}>
          <PracticeScreenResult practiceId={screen.practiceId} />
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
