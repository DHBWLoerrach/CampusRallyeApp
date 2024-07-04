import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

export default function IconButton({
  color = '#3b5998',
  icon,
  label,
  onPress,
}) {
  return (
    <FontAwesome6.Button
      name={icon}
      backgroundColor={color}
      onPress={onPress}
    >
      {label}
    </FontAwesome6.Button>
  );
}
