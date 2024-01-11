import { Text, Pressable, StyleSheet } from 'react-native';
import Colors from '../utils/Colors';

export default ({
  size,
  color,
  outline = false,
  disabled,
  onClick,
  children,
}) => {
  let buttonStyle = {
    ...styles.button.sizes[size ?? 'medium'],
    backgroundColor: color ?? Colors.dhbwRed,
  };
  let textStyle = styles.textSizes[size ?? 'medium'];
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
        styles.button.container,
        buttonStyle,
        disabled ? styles.button.disabled : '',
      ]}
      onPress={onClick}
      disabled={disabled}
    >
      <Text style={[styles.button.text, textStyle]}>{children}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    container: {
      alignItems: 'center',
      width: '100%',
    },
    text: {
      color: 'white',
    },
    disabled: {
      backgroundColor: 'lightgrey',
    },
    sizes: {
      small: {
        padding: 10,
        borderRadius: 5,
      },
      medium: {
        padding: 10,
        borderRadius: 5,
      },
      dialog: {
        padding: 10,
        borderRadius: 3,
        marginLeft: 7,
      },
    },
  },
  textSizes: {
    small: {
      fontSize: 15,
    },
    medium: {
      fontSize: 25,
    },
    dialog: {
      fontSize: 18,
    },
  },
});
