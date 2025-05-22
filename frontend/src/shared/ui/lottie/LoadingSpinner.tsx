import { useLottie } from 'lottie-react';
import rollingLoadingAnimation from './loading-in-progress.json';

const LoadingSpinner = () => {
  const options = {
    animationData: rollingLoadingAnimation,
    loop: true,
    style: {
      width: 24,
      height: 24,
    },
  };

  const { View } = useLottie(options);

  return <>{View}</>;
};

export default LoadingSpinner;
