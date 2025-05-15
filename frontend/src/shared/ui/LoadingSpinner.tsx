import { useLottie } from 'lottie-react';
import rollingLoadingAnimation from '@/assets/Rolling@1x-1.0s-200px-200px.json';

const LoadingSpinner = () => {
  const options = {
    animationData: rollingLoadingAnimation,
    loop: true,
    style: {
      width: 32,
      height: 32,
    },
  };

  const { View } = useLottie(options);

  return <>{View}</>;
};

export default LoadingSpinner;
