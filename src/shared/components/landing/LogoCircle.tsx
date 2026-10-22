import React from 'react';
import { View, Image } from 'react-native';

type Props = {
  size?: number;
};

export function LogoCircle({ size = 32 }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Image
        source={require('../../../../assets/logo.png')}
        style={{ width: size, height: size, resizeMode: 'contain' }}
      />
    </View>
  );
}