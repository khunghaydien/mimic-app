import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

export const CaptionIcon = ({ color, size = 18 }: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 7.5C5 6.12 6.12 5 7.5 5H9v4.2C9 10.88 7.88 12 6.2 12H5V7.5zM13 7.5C13 6.12 14.12 5 15.5 5H17v4.2C17 10.88 15.88 12 14.2 12H13V7.5z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M5 12v3.2C5 17.43 6.57 19 8.8 19H10M13 12v3.2C13 17.43 14.57 19 16.8 19H18"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
};
