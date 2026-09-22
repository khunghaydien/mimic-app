import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../theme';

type ToastType = 'success' | 'error';

export const toast = {
  show: (_type: ToastType, _message: string) => {},
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  return (
    <>
      {children}
      <ToastHost />
    </>
  );
};

const ToastHost = () => {
  const { colors } = useTheme();
  const [state, setState] = useState<{ type: ToastType; message: string }>({
    type: 'error',
    message: '',
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    toast.show = (type, message) => {
      setState({ type, message });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(
        () => setState((current) => ({ ...current, message: '' })),
        2800,
      );
    };
    return () => {
      toast.show = () => undefined;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!state.message) return null;

  return (
    <Pressable
      onPress={() => setState((current) => ({ ...current, message: '' }))}
      style={[
        styles.toast,
        {
          backgroundColor:
            state.type === 'success' ? colors.success : colors.danger,
        },
      ]}
    >
      <Text style={[styles.text, { color: colors.onPrimary }]}>{state.message}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
