// copied from https://github.com/DHBWLoerrach/CampusApp
// TO DO: Which colors do we need?

export type ThemePalette = {
  background: string;
  tabBarText: string;
  tabBarIcon: string;
  text: string;
  icon: string;
  card: string;
  scheduleHeader: string;
  scheduleInfo: string;
  dhbwGray: string;
  dhbwRed: string;
  dhbwRedLight: string;
  lightGray: string;
  dhbwRedWebView: string;
  cellBorder: string;
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
  dhbwRedWebView: 'rgb(226,0,26)', // FIXME: needed by WebView
  lightText: '#7F91A7',
  link: '#E2001A',
  text: '#2c2c2c',
  tabHeader: '#ffffff',
  lightMode: {
    cellBorder: '#EEEEEE',
    dhbwGray: '#5C6971',
    dhbwRed: '#E2001A',
    dhbwRedLight: '#E2001A80',
    lightGray: '#DADADA',
    dhbwRedWebView: 'rgb(226,0,26)', // FIXME: needed by WebView
    icon: '#484848',
    text: '#000',
    card: '#fff',
    scheduleHeader: '#ededed',
    scheduleInfo: '#7F91A7',
    tabBarText: '#777777',
    tabBarIcon: '#777777',
    background: '#fcfcfc',
  } as ThemePalette,
  darkMode: {
    background: '#000',
    tabBarText: '#fff',
    tabBarIcon: '#fff',
    text: '#fff',
    icon: '#fff',
    card: '#1e1e1e',
    scheduleHeader: '#1e1e1e',
    scheduleInfo: '#9fdbf5',
    dhbwGray: '#5C6971',
    dhbwRed: '#E2001A',
    dhbwRedLight: '#E2001A80',
    lightGray: '#DADADA',
    dhbwRedWebView: 'rgb(226,0,26)', // FIXME: needed by WebView
    cellBorder: '#1f1f1f',
  } as ThemePalette,
};

export default Colors;

