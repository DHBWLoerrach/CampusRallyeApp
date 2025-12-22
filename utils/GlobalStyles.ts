import { StyleSheet, Dimensions } from 'react-native';
import Colors from './Colors';
import Constants from './Constants';

// Display dimensions for dynamic calculations
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper function for responsive font sizes
const normalizeFont = (size: number) => {
  const scale = SCREEN_WIDTH / 375; // Basis: iPhone X width
  return Math.round(size * scale);
};

// Helper to build grouped StyleSheets so TypeScript knows nested keys
function createGroupedStyles<T extends Record<string, Record<string, any>>>(
  groups: T
) {
  const out: Record<string, any> = {};
  for (const key in groups) {
    out[key] = StyleSheet.create(groups[key] as any);
  }
  return out as { [K in keyof T]: { [P in keyof T[K]]: any } };
}

export const globalStyles = createGroupedStyles({
  default: {
    container: {
      flex: 1,
      flexDirection: 'column',
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'space-evenly',
      // backgroundColor intentionally left out to allow themed container (s.screen) to control it
      paddingVertical: SCREEN_HEIGHT * 0.02,
      paddingHorizontal: SCREEN_WIDTH * 0.05,
      maxWidth: SCREEN_WIDTH,
    },
    bigText: {
      color: Colors.dhbwGray,
      fontSize: normalizeFont(24),
      textAlign: 'center',
    },
    refreshContainer: {
      flexGrow: 1,
    },
  },
  rallyeModal: {
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      backgroundColor: Colors.lightMode.card,
      padding: 20,
      borderRadius: Constants.cornerRadius,
      width: '85%',
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'center',
    },
    rallyeCard: {
      backgroundColor: Colors.veryLightGray,
      borderRadius: Constants.cornerRadius,
      padding: 15,
      marginVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rallyeInfo: {
      flex: 1,
      paddingRight: 10,
    },
    rallyeName: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 5,
    },
    rallyeStudiengang: {
      fontSize: 16,
      color: Colors.dhbwGray,
      marginBottom: 3,
    },
    rallyeStatus: {
      fontSize: 14,
      color: Colors.mediumGray,
    },
    selectButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    cancelButton: {
      marginTop: 20,
      alignSelf: 'center',
      paddingVertical: 8,
      paddingHorizontal: 20,
    },
    noDataText: {
      textAlign: 'center',
      fontSize: 16,
      color: Colors.mediumGray,
      marginVertical: 10,
    },
  },
  rallyeStatesStyles: {
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-around',
      // backgroundColor removed for dark mode compatibility (use themed style)
      paddingHorizontal: SCREEN_WIDTH * 0.05,
      paddingVertical: SCREEN_HEIGHT * 0.03,
    },
    infoBox: {
      minWidth: '100%',
      padding: SCREEN_WIDTH * 0.04,
      // Theme color handled by ThemedView/AppStyles
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      maxHeight: SCREEN_HEIGHT * 0.33,
    },
    infoCameraBox: {
      minWidth: '100%',
      padding: SCREEN_WIDTH * 0.04,
      // Theme color handled by ThemedView/AppStyles
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      maxHeight: SCREEN_HEIGHT * 0.33,
    },
    infoTitle: {
      textAlign: 'center',
      color: Colors.dhbwGray,
    },
    infoSubtitle: {
      textAlign: 'center',
      color: Colors.dhbwGray,
      marginTop: '3%',
    },
    meetingPoint: {
      textAlign: 'center',
    },
  },
  cardStyles: {
    card: {
      width: '100%',
      minHeight: SCREEN_HEIGHT * 0.22,
      // backgroundColor handled by themed style
      borderRadius: Constants.cornerRadius,
      padding: SCREEN_WIDTH * 0.04,
      marginVertical: SCREEN_HEIGHT * 0.015,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    cardTitle: {
      marginTop: SCREEN_HEIGHT * 0.01,
      textAlign: 'center',
    },
    cardDescription: {
      textAlign: 'center',
      marginTop: SCREEN_HEIGHT * 0.01,
      paddingHorizontal: SCREEN_WIDTH * 0.02,
    },
    cardFace: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backfaceVisibility: 'hidden',
      position: 'absolute',
    },
    cardBack: {
      transform: [{ rotateY: '180deg' }],
    },
    passwordInput: {
      width: '80%',
      height: 40,
      borderWidth: 1,
      borderColor: Colors.dhbwGray,
      borderRadius: Constants.cornerRadius,
      paddingHorizontal: 10,
      marginVertical: 20,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 10,
    },
  },
  scoreboardStyles: {
    headerCell: {
      flex: 1,
      fontWeight: 'bold',
      color: Colors.dhbwGray,
      textAlign: 'center',
    },

    headerCellWide: {
      flex: 3,
      fontWeight: 'bold',
      color: Colors.dhbwGray,
      textAlign: 'center',
    },




    headerCellRank: {
      flex: 1,
      fontWeight: 'bold',
      color: Colors.dhbwGray,
      textAlign: 'left',
    },
    headerCellTeam: {
      flex: 3,
      fontWeight: 'bold',
      color: Colors.dhbwGray,
      textAlign: 'center',
    },
    headerCellTime: {
      flex: 1,
      fontWeight: 'bold',
      color: Colors.dhbwGray,
      textAlign: 'center',
    },
    headerCellPoints: {
      flex: 1,
      fontWeight: 'bold',
      color: Colors.dhbwGray,
      textAlign: 'right',
    },
    
    row: {
      flexDirection: 'row',
      padding: 15,
      // backgroundColor handled by themed style
      borderBottomWidth: 1,
      borderBottomColor: Colors.lightGray,
    },

    rowHighlighted: {
      backgroundColor: Colors.veryLightGray,
    },

    cell: {
      flex: 1,
      color: Colors.dhbwGray,
      textAlign: 'center',
    },

    cellWide: {
      flex: 3,
      textAlign: 'center',
    },

    cellHighlighted: {
      color: Colors.dhbwRed,
      fontWeight: 'bold',
    },





    cellRank: {
      flex: 0.8,
      color: Colors.dhbwGray,
      textAlign: 'center',
    },

    cellTeam: {
      flex: 3,
      textAlign: 'center',
      color: Colors.dhbwGray,
    },

    cellTime: {
      flex: 1.2,
      color: Colors.dhbwGray,
      textAlign: 'center',
    },

    cellPoints: {
      flex: 1,
      color: Colors.dhbwGray,
      textAlign: 'center',
    },

  },
  settingsStyles: {
    container: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },

    tile: {
      width: '80%',
      height: 100,
      marginVertical: 10,
      // backgroundColor handled by themed style
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.mediumGray,
    },
    tileText: {
      fontSize: 20,
      color: Colors.mediumGray,
    },
  },
  multipleChoiceStyles: {
    squareButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginStart: 30,
      marginBottom: 20,
    },
    answerText: {
      fontSize: 20,
    },
    innerSquare: {
      width: 24,
      height: 24,
      marginRight: 10,
      borderWidth: 1,
      borderColor: Colors.dhbwGray,
    },
  },
  qrCodeStyles: {
    camera: {
      width: '100%',
      height: '100%',
    },
    buttonRow: {
      flexDirection: 'column',
      gap: 10,
      marginVertical: 20,
    },
    cameraBox: {
      width: '100%',
      padding: SCREEN_WIDTH * 0.04,
      // backgroundColor handled by themed style
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      maxHeight: SCREEN_HEIGHT * 0.3,
    },
  },
  skillStyles: {
    input: {
      minWidth: '100%',
      height: 40,
      borderColor: Colors.dhbwGray,
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      paddingVertical: 10,
      fontSize: Constants.smallFont,
    },
  },
  uploadStyles: {
    camera: {
      width: '100%',
      aspectRatio: 1,
      maxHeight: '100%',
    },
    image: {
      width: '100%',
      aspectRatio: 1,
      maxHeight: '100%',
    },
  },
  imprintStyles: {
    texts: {
      container: {
        padding: SCREEN_WIDTH * 0.04,
      },
      block: {
        marginBottom: SCREEN_HEIGHT * 0.02,
      },
      headline: {
        fontSize: normalizeFont(18),
        marginBottom: SCREEN_HEIGHT * 0.01,
      },
    },
  },
  informationStyles: {
    container: {
      padding: SCREEN_WIDTH * 0.04,
    },
    paragraph: {
      marginBottom: SCREEN_HEIGHT * 0.02,
      fontSize: normalizeFont(14),
    },
  },
  uiButtonStyles: {
    button: {
      container: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: SCREEN_HEIGHT * 0.015,
        paddingHorizontal: SCREEN_WIDTH * 0.04,
      },
      text: {
        color: 'white',
        fontWeight: '600',
        fontSize: normalizeFont(16),
        textAlign: 'center',
      },
      disabled: {
        backgroundColor: 'lightgrey',
      },
      sizes: {
        small: {
          padding: SCREEN_WIDTH * 0.02,
          borderRadius: Constants.cornerRadius,
        },
        medium: {
          padding: SCREEN_WIDTH * 0.03,
          borderRadius: Constants.cornerRadius,
        },
        dialog: {
          padding: 10,
          borderRadius: Constants.cornerRadius,
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
  },
  welcomeStyles: {
    container: {
      flex: 1,
      alignItems: 'center',
      // backgroundColor handled by themed style
      paddingHorizontal: SCREEN_WIDTH * 0.04,
      justifyContent: 'space-evenly',
    },
    headerImage: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT * 0.3,
      resizeMode: 'cover',
    },
    header: {
      marginTop: SCREEN_HEIGHT * 0.01,
      flexDirection: 'row',
      alignItems: 'center',
    },
    logo: {
      width: SCREEN_WIDTH * 0.12,
      height: SCREEN_WIDTH * 0.12,
      marginLeft: SCREEN_WIDTH * 0.03,
    },
    text: {
      color: Colors.dhbwGray,
    },
    title: {
      flex: 1,
      color: Colors.dhbwRed,
    },
    content: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      paddingVertical: SCREEN_HEIGHT * 0.02,
    },
    button: {
      width: '100%',
      marginVertical: 60,
    },
    offline: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  },
  teamStyles: {
    container: {
      flex: 1,
      alignItems: 'center',
      // backgroundColor handled by themed style
      justifyContent: 'center',
      paddingHorizontal: SCREEN_WIDTH * 0.05,
      paddingVertical: SCREEN_HEIGHT * 0.03,
      width: '100%',
    },
    infoBox: {
      width: '100%',
      padding: SCREEN_WIDTH * 0.04,
      // Theme color handled by ThemedView/AppStyles
      borderRadius: 10,
      marginBottom: SCREEN_HEIGHT * 0.02,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    title: {
      fontSize: normalizeFont(24),
      color: Colors.dhbwGray,
      textAlign: 'center',
      fontWeight: '600',
      marginBottom: SCREEN_HEIGHT * 0.02,
    },
    message: {
      fontSize: normalizeFont(18),
      color: Colors.dhbwGray,
      textAlign: 'center',
      marginBottom: SCREEN_HEIGHT * 0.02,
    },
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: Colors.dhbwRed,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
