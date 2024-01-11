import { useState } from 'react';
import { useBetween } from 'use-between';

function sharedStates() {
  // set all states, that have to be used between different components
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [points, setPoints] = useState(0);
  const [qrScan, setQRScan] = useState(false);
  return {
    questions,
    setQuestions,
    currentQuestion,
    setCurrentQuestion,
    points,
    setPoints,
    qrScan,
    setQRScan,
  };
}

// make states usable for the components
export const useSharedStates = () => useBetween(sharedStates);
