// copied from https://github.com/DHBWLoerrach/CampusApp
// TO DO: Which colors do we need?

export type ThemePalette = {
  background: string;
  surface0: string;
  surface1: string;
  surface2: string;
  tabBarText: string;
  tabBarIcon: string;
  text: string;
  textMuted: string;
  icon: string;
  card: string;
  scheduleHeader: string;
  scheduleInfo: string;
  dhbwGray: string;
  dhbwRed: string;
  dhbwRedLight: string;
  lightGray: string;
  cellBorder: string;
  borderSubtle: string;
};

const Colors = {
  cellBorder: '#EEEEEE',
  veryLightGray: 'rgb(233,233,233)',
  lightGray: '#DADADA',
  mediumGray: '#777777',
  dhbwGray: '#5C6971',
  dhbwRed: '#E2001A',
  dhbwRedLight: '#E2001A80',
  lightBlue: '#9fdbf5',
  contrastBlue: '#334D7A',
  lightText: '#7F91A7',
  link: '#E2001A',
  text: '#2c2c2c',
  tabHeader: '#ffffff',
  lightMode: {
    surface0: '#fcfcfc',
    surface1: '#ffffff',
    surface2: '#f3f3f3',
    borderSubtle: '#E7E7E7',
    cellBorder: '#EEEEEE',
    dhbwGray: '#5C6971',
    dhbwRed: '#E2001A',
    dhbwRedLight: '#E2001A80',
    lightGray: '#DADADA',
    icon: '#484848',
    text: '#000',
    textMuted: '#777777',
    card: '#ffffff',
    scheduleHeader: '#f3f3f3',
    scheduleInfo: '#7F91A7',
    tabBarText: '#777777',
    tabBarIcon: '#777777',
    background: '#fcfcfc',
  } as ThemePalette,
  darkMode: {
    surface0: '#121214',
    surface1: '#1c1c1f',
    surface2: '#26262a',
    borderSubtle: '#2a2a2e',
    background: '#121214',
    tabBarText: '#fff',
    tabBarIcon: '#fff',
    text: '#fff',
    textMuted: '#a1a1aa',
    icon: '#fff',
    card: '#1c1c1f',
    scheduleHeader: '#1c1c1f',
    scheduleInfo: '#9fdbf5',
    dhbwGray: '#5C6971',
    dhbwRed: '#E2001A',
    dhbwRedLight: '#E2001A80',
    lightGray: '#DADADA',
    cellBorder: '#2a2a2e',
  } as ThemePalette,
};

export default Colors;
