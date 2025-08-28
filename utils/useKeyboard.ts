import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent, Platform } from 'react-native';

/**
 * useKeyboard
 * Determines keyboard visibility and height (including safe area
 * offset on iOS) and a boolean indicating if the keyboard is visible.
 */
export function useKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onShow = (e: KeyboardEvent) => {
      const height = e.endCoordinates.height;
      setKeyboardHeight(height);
      setVisible(true);
    };
    const onHide = () => {
      setKeyboardHeight(0);
      setVisible(false);
    };

    const showSub = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      onShow
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      onHide
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return { keyboardHeight, keyboardVisible: visible };
}
