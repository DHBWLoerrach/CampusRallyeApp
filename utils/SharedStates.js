import { useState } from 'react';
import { useBetween } from 'use-between';

function sharedStates() {
  // set all states, that have to be used between different components
  const [points, setPoints] = useState(0);

  return {
    points,
    setPoints,
  };
}

// make states usable for the components
export const useSharedStates = () => useBetween(sharedStates);
