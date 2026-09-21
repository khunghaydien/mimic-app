import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreenLogin } from './component/AuthScreenLogin';
import { AuthScreenRegister } from './component/AuthScreenRegister';

export type AuthScreenState = { status: 'login' } | { status: 'register' };

export const AuthScreen = memo(({
  screen,
  onScreenChange,
}: {
  screen: AuthScreenState;
  onScreenChange: (screen: AuthScreenState) => void;
}) => {
  const isLogin = screen.status === 'login';

  return (
    <View style={styles.fill}>
      <View
        style={[styles.fill, !isLogin && styles.hidden]}
        pointerEvents={isLogin ? 'auto' : 'none'}
      >
        <AuthScreenLogin
          onOpenRegister={() => onScreenChange({ status: 'register' })}
        />
      </View>
      {isLogin ? null : (
        <AuthScreenRegister onOpenLogin={() => onScreenChange({ status: 'login' })} />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hidden: { display: 'none' },
});
