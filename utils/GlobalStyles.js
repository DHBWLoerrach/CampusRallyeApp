// utils/globalStyles.js
import { StyleSheet, Dimensions } from "react-native";
import Colors from "./Colors";
import Constants from "./Constants";

// Bildschirmmaße für dynamische Berechnungen
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Helfer-Funktion für responsive Schriftgrößen
const normalizeFont = (size) => {
  const scale = SCREEN_WIDTH / 375; // Basis: iPhone X Breite
  return Math.round(size * scale);
};

export const globalStyles = StyleSheet.create({
  default: {
    container: {
      flex: 1,
      flexDirection: "column",
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#fff",
      paddingVertical: SCREEN_HEIGHT * 0.02,
      paddingHorizontal: SCREEN_WIDTH * 0.05,
      maxWidth: SCREEN_WIDTH,
    },
    bigText: {
      color: Colors.dhbwGray,
      fontSize: normalizeFont(24),
      textAlign: "center",
    },
    refreshContainer: {
      flexGrow: 1,
    },
    section: {
      marginBottom: 20,
      backgroundColor: "#fff",
      borderRadius: 10,
      borderWidth: 1,
      padding: 20,
      width: "100%",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    question: {
      fontSize: 20,
      marginBottom: 30,
      textAlign: "center",
    },
  },

  rallyeStatesStyles: {
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "space-around",
      backgroundColor: "white",
      paddingHorizontal: SCREEN_WIDTH * 0.05,
      paddingVertical: SCREEN_HEIGHT * 0.03,
    },
    successIcon: {
      marginBottom: "8%",
    },
    title: {
      color: Colors.dhbwRed,
      fontWeight: "400",
      fontSize: normalizeFont(30),
      marginBottom: "8%",
      textAlign: "center",
    },
    infoBox: {
      minWidth: "100%",
      padding: SCREEN_WIDTH * 0.04,
      backgroundColor: "white",
      borderRadius: 10,
      shadowColor: "#000",
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
      fontSize: normalizeFont(20),
      textAlign: "center",
      color: Colors.dhbwGray,
    },
    infoSubtitle: {
      fontSize: 16,
      textAlign: "center",
      color: Colors.dhbwGray,
      marginTop: "3%",
    },
    pointsTitle: {
      fontSize: 22,
      textAlign: "center",
      color: Colors.dhbwGray,
    },
    pointsValue: {
      fontSize: 40,
      textAlign: "center",
      color: Colors.dhbwRed,
      fontWeight: "600",
      marginTop: "3%",
    },
    footer: {
      fontSize: 18,
      textAlign: "center",
      color: Colors.dhbwGray,
      marginTop: 20,
      paddingHorizontal: 20,
    },
    iconContainer: {
      alignItems: "center",
      marginBottom: 30,
    },
    footer: {
      fontSize: 18,
      textAlign: "center",
      color: Colors.dhbwGray,
    },
  },

  cardStyles: {
    card: {
      width: "100%",
      height: SCREEN_HEIGHT * 0.22,
      backgroundColor: "white",
      borderRadius: 15,
      padding: SCREEN_WIDTH * 0.04,
      marginVertical: SCREEN_HEIGHT * 0.015,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    cardTitle: {
      fontSize: normalizeFont(16),
      fontWeight: "bold",
      color: Colors.dhbwGray,
      marginTop: SCREEN_HEIGHT * 0.01,
      textAlign: "center",
    },
    cardDescription: {
      fontSize: normalizeFont(14),
      color: Colors.dhbwGray,
      textAlign: "center",
      marginTop: SCREEN_HEIGHT * 0.01,
      paddingHorizontal: SCREEN_WIDTH * 0.02,
    },
    cardFace: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      backfaceVisibility: "hidden",
      position: "absolute",
    },
    cardBack: {
      backgroundColor: "white",
      transform: [{ rotateY: "180deg" }],
    },
    passwordInput: {
      width: "80%",
      height: 40,
      borderWidth: 1,
      borderColor: Colors.dhbwGray,
      borderRadius: 5,
      paddingHorizontal: 10,
      marginVertical: 20,
    },
    buttonRow: {
      flexDirection: "row",
      gap: 10,
    },
    button: {
      backgroundColor: Colors.dhbwRed,
      padding: 10,
      borderRadius: 5,
    },
    buttonText: {
      color: "white",
      fontWeight: "bold",
    },
  },

  scoreboardStyles: {
    container: {
      flex: 1,
      backgroundColor: "white",
    },
    title: {
      color: Colors.dhbwGray,
      fontSize: 30,
      fontWeight: "bold",
      marginBottom: 10,
      textAlign: "center",
    },
    teamInfo: {
      fontSize: 20,
      fontWeight: "bold",
      color: Colors.dhbwGray,
      marginBottom: 10,
      textAlign: "center",
    },
    tableHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 5,
    },
    headerText: {
      color: Colors.dhbwGray,
      fontSize: 20,
      fontWeight: "bold",
      flex: 1,
      textAlign: "center",
    },
    tableRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: Colors.lightGray,
    },
    ourTeam: {
      backgroundColor: Colors.lightGray,
    },
    rowText: {
      flex: 1,
      fontSize: 16,
      textAlign: "center",
    },
    scrollContent: {
      paddingVertical: SCREEN_HEIGHT * 0.02,
      paddingHorizontal: SCREEN_WIDTH * 0.05,
    },
    headerCell: {
      flex: 1,
      fontWeight: "bold",
      color: Colors.dhbwGray,
      textAlign: "center",
    },

    headerCellWide: {
      flex: 3,
      fontWeight: "bold",
      color: Colors.dhbwGray,
      textAlign: "center",
    },

    row: {
      flexDirection: "row",
      padding: 15,
      backgroundColor: "white",
      borderBottomWidth: 1,
      borderBottomColor: Colors.lightGray,
    },

    rowHighlighted: {
      backgroundColor: Colors.veryLightGray,
    },

    cell: {
      flex: 1,
      color: Colors.dhbwGray,
      textAlign: "center",
    },

    cellWide: {
      flex: 3,
      textAlign: "center",
    },

    cellHighlighted: {
      color: Colors.dhbwRed,
      fontWeight: "bold",
    },
  },

  votingStyles: {
    main: {
      padding: 20,
    },
    text: {
      fontSize: 20,
      color: Colors.dhbwGray,
      textAlign: "center",
    },
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 5,
    },
    label: {
      fontSize: 16,
      color: Colors.dhbwGray,
      marginRight: 5,
    },
    value: {
      fontSize: 16,
      fontWeight: "bold",
    },
  },

  settingsStyles: {
    container: {
      flex: 1,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    },

    tile: {
      width: "80%",
      height: 100,
      marginVertical: 10,
      backgroundColor: "white",
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "grey",
    },

    tileText: {
      fontSize: 20,
      color: "grey",
    },

    button: {
      paddingTop: 20,
      marginVertical: 10,
    },
  },

  imageStyles: {
    container: {
      flex: 1,
      backgroundColor: "white",
      padding: 20,
    },
    questionBox: {
      width: "90%",
      marginBottom: 20,
      padding: 20,
      backgroundColor: "white",
      borderRadius: 10,
      // ...shadowStyle,
    },
    title: {
      fontSize: 24,
      color: Colors.dhbwGray,
      textAlign: "center",
    },
    input: {
      width: "100%",
      height: 50,
      borderColor: Colors.dhbwGray,
      borderWidth: 1,
      borderRadius: 5,
      padding: 10,
      fontSize: 16,
      marginBottom: 15,
    },
    image: {
      width: SCREEN_WIDTH * 0.9,
      height: SCREEN_HEIGHT * 0.3,
      resizeMode: "contain",
    },
    contentContainer: {
      flexGrow: 1,
      justifyContent: "center",
      paddingBottom: 200, // quickfix for keyboard covering input on small screens
    },
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    inputLabel: {
      fontSize: 16,
      marginBottom: 5,
    },
    input: {
      width: "100%",
      height: 40,
      borderColor: Colors.dhbwGray,
      borderWidth: 1,
      marginBottom: 20,
      paddingHorizontal: 10,
      fontSize: Constants.bigFont,
    },
    answerContainer: {
      marginTop: 20,
      alignItems: "center",
    },
    answerLabel: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 5,
    },
    answer: {
      fontSize: 16,
    },
    buttonContainer: {
      backgroundColor: Colors.dhbwRed,
      margin: 6,
      borderRadius: 5,
    },
    buttonContainerDeactive: {
      backgroundColor: Colors.dhbwGray,
      margin: 6,
      borderRadius: 5,
    },
    picture: {
      width: 300,
      height: 300,
      marginBottom: 20,
    },
  },

  multipleChoiceStyles: {
    squareButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
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
    contentContainer: {
      flexGrow: 1,
      justifyContent: "center",
      paddingBottom: 200, // quickfix for keyboard covering input on small screens
    },
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    inputLabel: {
      fontSize: 16,
      marginBottom: 5,
    },
    input: {
      width: "100%",
      height: 40,
      borderColor: Colors.dhbwGray,
      borderWidth: 1,
      marginBottom: 20,
      paddingHorizontal: 10,
      fontSize: Constants.bigFont,
    },
    answerContainer: {
      marginTop: 20,
      alignItems: "center",
    },
    answerLabel: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 5,
    },
    answer: {
      fontSize: 16,
    },
    buttonContainer: {
      backgroundColor: Colors.dhbwRed,
      margin: 6,
      borderRadius: 5,
    },
    buttonContainerDeactive: {
      backgroundColor: Colors.dhbwGray,
      margin: 6,
      borderRadius: 5,
    },
  },

  qrCodeStyles: {
    container: {
      flex: 1,
      flexDirection: "column",
      alignItems: "center",
      backgroundColor: "#fff",
      marginTop: 20,
    },
    camera: {
      width: "100%",
      height: "100%",
    },
    buttonRow: {
      flexDirection: "column",
      gap: 10,
      marginVertical: 20,
    },
    cameraBox: {
      width: "100%",
      padding: SCREEN_WIDTH * 0.04,
      backgroundColor: "white",
      borderRadius: 10,
      shadowColor: "#000",
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
    contentContainer: {
      flexGrow: 1,
      justifyContent: "center",
      paddingBottom: 200,
    },
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 10,
    },
    inputLabel: {
      fontSize: 16,
      marginBottom: 5,
    },
    input: {
      minWidth: "100%",
      height: 40,
      borderColor: Colors.dhbwGray,
      borderWidth: 1,
      borderRadius: 5,
      marginBottom: 20,
      paddingHorizontal: 10,
      fontSize: Constants.bigFont,
    },
    answerContainer: {
      marginTop: 20,
      alignItems: "center",
    },
    answerLabel: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 5,
    },
    answer: {
      fontSize: 16,
    },
    buttonContainer: {
      backgroundColor: Colors.dhbwRed,
      margin: 6,
      borderRadius: 5,
    },
    buttonContainerDeactive: {
      backgroundColor: Colors.dhbwGray,
      margin: 6,
      borderRadius: 5,
    },
  },

  uploadStyles: {
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "space-around",
      paddingVertical: SCREEN_HEIGHT * 0.02,
    },
    camera: {
      width: SCREEN_WIDTH * 0.8,
      aspectRatio: 1,
      maxHeight: SCREEN_HEIGHT * 0.4,
    },
    image: {
      width: SCREEN_WIDTH * 0.8,
      aspectRatio: 1,
      maxHeight: SCREEN_HEIGHT * 0.4,
    },
    buttonRow: {
      flexDirection: "row",
      gap: SCREEN_WIDTH * 0.05,
      marginVertical: SCREEN_HEIGHT * 0.02,
    },
  },

  uploadQuestionStyles: {
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "space-between",
      marginHorizontal: SCREEN_WIDTH * 0.05,
    },
    buttonContainer: {
      marginVertical: SCREEN_HEIGHT * 0.02,
      borderRadius: 5,
    },
  },

  imprintStyles: {
    textSizes: {
      small: { fontSize: normalizeFont(12) },
      medium: { fontSize: normalizeFont(20) },
      dialog: { fontSize: normalizeFont(16) },
    },
    button: {
      container: {
        backgroundColor: Colors.dhbwRed,
        alignItems: "center",
      },
      text: {
        color: "white",
      },
      disabled: {
        backgroundColor: "grey",
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
    texts: {
      container: {
        padding: SCREEN_WIDTH * 0.04,
      },
      block: {
        marginBottom: SCREEN_HEIGHT * 0.02,
      },
      quote: {
        fontStyle: "italic",
        marginHorizontal: 15,
      },
      headline: {
        fontSize: normalizeFont(18),
        marginBottom: SCREEN_HEIGHT * 0.01,
      },
      link: {
        color: Colors.link,
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

  questionStyles: {
    container: {
      flex: 1,
      justifyContent: "space-between",
      padding: SCREEN_WIDTH * 0.05,
      maxHeight: SCREEN_HEIGHT * 0.9,
    },
    questionText: {
      fontSize: normalizeFont(18),
      flex: 0,
    },
    inputContainer: {
      width: "100%",
      flex: 0,
    },
    input: {
      height: SCREEN_HEIGHT * 0.06,
      fontSize: normalizeFont(16),
    },
  },

  imageQuestionStyles: {
    image: {
      width: SCREEN_WIDTH * 0.9,
      height: SCREEN_HEIGHT * 0.3,
      resizeMode: "contain",
    },
  },

  cameraStyles: {
    camera: {
      width: SCREEN_WIDTH * 0.8,
      height: SCREEN_WIDTH * 0.8, // Quadratisch
      maxHeight: SCREEN_HEIGHT * 0.4, // Max 40% der Höhe
    },
  },

  hintStyles: {
    hintTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginVertical: 20,
    },
    hintText: {
      fontSize: normalizeFont(16),
    },
    hintContainer: {
      marginTop: SCREEN_HEIGHT * 0.02,
      maxHeight: SCREEN_HEIGHT * 0.15,
    },
  },

  uiButtonStyles: {
    button: {
      container: {
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: SCREEN_HEIGHT * 0.015,
        paddingHorizontal: SCREEN_WIDTH * 0.04,
      },
      text: {
        color: "white",
        fontWeight: "600",
        fontSize: normalizeFont(16),
        textAlign: "center",
      },
      disabled: {
        backgroundColor: "lightgrey",
      },
      sizes: {
        small: {
          padding: SCREEN_WIDTH * 0.02,
          borderRadius: 5,
        },
        medium: {
          padding: SCREEN_WIDTH * 0.03,
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
  },

  welcomeStyles: {
    container: {
      flex: 1,
      alignItems: "center",
      backgroundColor: "#fff",
      paddingHorizontal: SCREEN_WIDTH * 0.04,
      justifyContent: "space-evenly",
    },
    headerImage: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT * 0.3,
      resizeMode: "cover",
    },
    header: {
      marginTop: SCREEN_HEIGHT * 0.01,
      flexDirection: "row",
      alignItems: "center",
    },
    logo: {
      width: SCREEN_WIDTH * 0.12,
      height: SCREEN_WIDTH * 0.12,
      marginLeft: SCREEN_WIDTH * 0.03,
    },
    text: {
      color: Colors.dhbwGray,
      fontSize: normalizeFont(16),
    },
    title: {
      flex: 1,
      color: Colors.dhbwRed,
      fontWeight: "500",
      fontSize: normalizeFont(18),
    },
    content: {
      flex: 1,
      width: "100%",
      justifyContent: "center",
      paddingVertical: SCREEN_HEIGHT * 0.02,
    },
    button: {
      width: "100%",
      marginVertical: 60,
    },
    offline: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
  },

  teamStyles: {
    container: {
      flex: 1,
      alignItems: "center",
      backgroundColor: "white",
      justifyContent: "center",
      paddingHorizontal: SCREEN_WIDTH * 0.05,
      paddingVertical: SCREEN_HEIGHT * 0.03,
      width: "100%",
    },
    infoBox: {
      width: "100%",
      padding: SCREEN_WIDTH * 0.04,
      backgroundColor: "white",
      borderRadius: 10,
      marginBottom: SCREEN_HEIGHT * 0.02,
      shadowColor: "#000",
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
      textAlign: "center",
      fontWeight: "600",
      marginBottom: SCREEN_HEIGHT * 0.02,
    },
    teamName: {
      fontSize: normalizeFont(22),
      color: Colors.dhbwRed,
      textAlign: "center",
      marginVertical: SCREEN_HEIGHT * 0.02,
    },
    message: {
      fontSize: normalizeFont(18),
      color: Colors.dhbwGray,
      textAlign: "center",
      marginBottom: SCREEN_HEIGHT * 0.02,
    },
  },
});
