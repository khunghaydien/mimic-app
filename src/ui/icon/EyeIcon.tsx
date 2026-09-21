import Svg, { Path, Circle } from 'react-native-svg';

import type { IconProps } from './types';

export const EyeIcon = ({ color }: IconProps) => {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
};
