import React, { useState } from 'react';
import { useBetween } from 'use-between';

function sharedStates() {
  // set all States, that have to be used between different components
  const [fragen, setFragen] = useState([]);
  const [aktuelleFrage, setAktuelleFrage] = useState(0);
  const [points, setPoints] = useState(0)
  const [qrscan, setQrscan] = useState(false)
  return {
    fragen,
    setFragen,
    aktuelleFrage,
    setAktuelleFrage,
    points,
    setPoints,
    qrscan,
    setQrscan
  }
}

// make States usable for the components
export const useSharedStates = () => useBetween(sharedStates);