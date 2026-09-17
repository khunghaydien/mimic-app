import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

export function PlayIcon({ color }: IconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M8 5.5v13l11-6.5L8 5.5z" fill={color} />
    </Svg>
  );
}
