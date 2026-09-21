import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

export const SpeakerIcon = ({ color }: IconProps) => {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 5L6 9H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3l5 4V5z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M15.5 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
};
