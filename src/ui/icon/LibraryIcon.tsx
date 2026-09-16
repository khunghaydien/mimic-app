import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

export function LibraryIcon({ color }: IconProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M4 3h2v18H4V3zm3 0h13v18H7V3zm2 2v14h9V5H9zm2 2h5v2h-5V7zm0 4h5v2h-5v-2z"
        fill={color}
      />
    </Svg>
  );
}
