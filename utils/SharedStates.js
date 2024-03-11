import { useState } from 'react';
import { useBetween } from 'use-between';

function sharedStates() {
  // set all states, that have to be used between different components
  const [questions, setQuestions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [points, setPoints] = useState(0);
  const [rallye, setRallye] = useState(null);
  const [group, setGroup] = useState(null);
  const [qrScan, setQRScan] = useState(false);
  const [useRallye, setUseRallye] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [remainingTime,setRemainingTime] = useState(0);
  useSharedStates;

  return {
    questions,
    setQuestions,
    currentQuestion,
    setCurrentQuestion,
    points,
    setPoints,
    qrScan,
    setQRScan,
    rallye,
    setRallye,
    groups,
    setGroups,
    group,
    setGroup,
    useRallye,
    setUseRallye,
    enabled,
    setEnabled,
    remainingTime,
    setRemainingTime
  };
}

// make states usable for the components
export const useSharedStates = () => useBetween(sharedStates);
