import { type ReactNode } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  hitSlop?: number;
  style?: PressableProps['style'];
  children: ReactNode;
};

export const IconButton = ({
  label,
  onPress,
  disabled,
  hitSlop = 8,
  style,
  children,
}: Props) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View pointerEvents="none">{children}</View>
    </Pressable>
  );
};
