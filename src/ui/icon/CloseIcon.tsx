import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

export const CloseIcon = ({ color }: IconProps) => {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 6l12 12M18 6L6 18"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
};
