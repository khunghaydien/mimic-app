import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

export function MenuIcon({ color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"
        fill={color}
      />
    </Svg>
  );
}
