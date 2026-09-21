import Svg, { Path } from 'react-native-svg';

import type { IconProps } from './types';

export const GenerateIcon = ({ color }: IconProps) => {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l1.6 5 5 1.6-5 1.6L12 16.8l-1.6-5.6-5-1.6 5-1.6L12 3zM19.5 14.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
