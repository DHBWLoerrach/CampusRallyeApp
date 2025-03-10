import { Text, Pressable, StyleSheet } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Colors from '../utils/Colors';
import { globalStyles } from '../utils/GlobalStyles';

export default ({
  color,
  disabled,
  icon,
  iconRight = false,
  outline = false,
  onPress,
  size = 'small',
  children,
}) => {
  let buttonStyle = {
    ...globalStyles.uiButtonStyles.button.sizes[size],
    backgroundColor: color ?? Colors.dhbwRed,
    flexDirection: iconRight ? 'row-reverse' : 'row',
  };
  let textStyle = globalStyles.uiButtonStyles.textSizes[size];
  if (outline) {
    buttonStyle = {
      ...buttonStyle,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color ?? Colors.dhbwRed,
      backgroundColor: 'transparent',
    };
    textStyle = {
      ...textStyle,
      color: color ?? Colors.dhbwRed,
    };
  }

  return (
    <Pressable
      style={[
        globalStyles.uiButtonStyles.button.container,
        buttonStyle,
        disabled ? globalStyles.uiButtonStyles.button.disabled : '',
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && (
        <FontAwesome6
          name={icon}
          size={20}
          color="white"
          style={{ marginRight: 10 }}
        />
      )}
      <Text style={[globalStyles.uiButtonStyles.button.text, textStyle]}>{children}</Text>
    </Pressable>
  );
};
