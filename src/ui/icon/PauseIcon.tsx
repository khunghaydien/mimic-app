import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

export function PauseIcon({ color }: IconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 6h2.5v12H8V6zM13.5 6H16v12h-2.5V6z"
        fill={color}
      />
    </Svg>
  );
}
