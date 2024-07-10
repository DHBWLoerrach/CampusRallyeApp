import { Text, Pressable, StyleSheet } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Colors from '../utils/Colors';

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
    ...styles.button.sizes[size],
    backgroundColor: color ?? Colors.dhbwRed,
    flexDirection: iconRight ? 'row-reverse' : 'row',
  };
  let textStyle = styles.textSizes[size];
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
      <Text style={[styles.button.text, textStyle]}>{children}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    container: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      color: 'white',
      fontWeight: '600',
      textAlign: 'center',
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
