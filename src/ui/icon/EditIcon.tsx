import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

export function EditIcon({ color }: IconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
