import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

export function HomeIcon({ color }: IconProps) {
  return (
    <Svg width={22} height={20} viewBox="0 0 22 20">
      <Path
        d="M3 20V10.625L1.2 12L0 10.4L3 8.1V5H5V6.575L11 2L22 10.4L20.8 11.975L19 10.625V20H3ZM5 18H10V14H12V18H17V9.1L11 4.525L5 9.1V18ZM3 4C3 3.16667 3.29167 2.45833 3.875 1.875C4.45833 1.29167 5.16667 1 6 1C6.28333 1 6.52083 0.904167 6.7125 0.7125C6.90417 0.520833 7 0.283333 7 0H9C9 0.833333 8.70833 1.54167 8.125 2.125C7.54167 2.70833 6.83333 3 6 3C5.71667 3 5.47917 3.09583 5.2875 3.2875C5.09583 3.47917 5 3.71667 5 4H3Z"
        fill={color}
      />
    </Svg>
  );
}
