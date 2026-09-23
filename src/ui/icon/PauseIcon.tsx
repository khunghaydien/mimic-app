import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

export const PauseIcon = ({ color, size = 18 }: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 6h2.5v12H8V6zM13.5 6H16v12h-2.5V6z"
        fill={color}
      />
    </Svg>
  );
};
