import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

export const PlayIcon = ({ color, size = 18 }: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.4 7.6C7.4 5.55 9.65 4.35 11.35 5.45L17.85 9.55C19.45 10.55 19.45 13.45 17.85 14.45L11.35 18.55C9.65 19.65 7.4 18.45 7.4 16.4Z"
        stroke={color}
        strokeWidth={2}
      />
    </Svg>
  );
};
