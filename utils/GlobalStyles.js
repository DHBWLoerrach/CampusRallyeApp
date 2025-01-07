// utils/globalStyles.js
import { StyleSheet, Dimensions } from "react-native";
import Colors from "./Colors";
import Constants from "./Constants";

export const globalStyles = StyleSheet.create({
  default: {
    container: {
      flex: 1,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#fff",
    },
    bigText: {
      color: Colors.dhbwGray,
      fontSize: 30,
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
      // Elevation for Android
      elevation: 5,
    },
    question: {
      fontSize: 20,
      marginBottom: 30,
      textAlign: "center",
    },
  },

  cardStyles: {
    card: {
      width: "90%",
      backgroundColor: "white",
      borderRadius: 15,
      padding: 15,
      marginVertical: 20,
      alignItems: "center",
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
      fontSize: 18,
      fontWeight: "bold",
      color: Colors.dhbwGray,
      marginTop: 10,
      textAlign: "center",
    },
    cardDescription: {
      fontSize: 14,
      color: Colors.dhbwGray,
      textAlign: "center",
      marginTop: 5,
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
      width: Dimensions.get("window").width * 0.8,
      height: Dimensions.get("window").width * 0.8,
    },
    buttonRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      columnGap: 30,
      rowGap: 10,
      marginBottom: 30,
    },
  },

  skillStyles: {
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
      justifyContent: "center",
    },
    camera: {
      width: Dimensions.get("window").width * 0.8,
      height: Dimensions.get("window").width * 0.8,
    },
    image: {
      width: Dimensions.get("window").width * 0.8,
      height: Dimensions.get("window").width * 0.8,
    },
    buttonRow: {
      flexDirection: "row",
      gap: 30,
      marginVertical: 10,
    },
  },

  uploadQuestionStyles: {
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 10,
    },
    buttonContainer: {
      margin: 10,
      borderRadius: 5,
    },
    buttons: {
      justifyContent: "center",
      alignItems: "center",
      margin: 10,
      marginBottom: 10,
      padding: 10,
    },
    redButtonContainer: {
      backgroundColor: Colors.dhbwRed,
      margin: 6,
      borderRadius: 5,
    },
  },

  imprintStyles: {
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
        padding: 15,
      },
      block: {
        marginBottom: 20,
      },
      quote: {
        fontStyle: "italic",
        marginHorizontal: 15,
      },
      headline: {
        fontSize: 20,
      },
      link: {
        color: Colors.link,
      },
    },
  },

  informationStyles: {
    container: {
      padding: 15,
    },
    paragraph: {
      marginBottom: 10,
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

  welcomeStyles: {
    container: {
      flex: 1,
      alignItems: "center",
      backgroundColor: "#fff",
      paddingHorizontal: 10,
    },
    headerImage: {
      width: Dimensions.get("window").width,
      height: Dimensions.get("window").height / 3,
    },
    header: {
      marginTop: 10,
      flexDirection: "row",
    },
    logo: {
      marginLeft: 20,
      width: 60,
      height: 60,
    },
    text: {
      color: Colors.dhbwGray,
      fontSize: 20,
    },
    title: {
      flex: 1,
      color: Colors.dhbwRed,
      fontWeight: 500,
      alignSelf: "center",
    },
    content: {
      flex: 1,
      width: "100%",
    },
    button: {
      width: "100%",
      marginVertical: 60,
    },
    offline: {
      alignItems: "center",
      justifyContent: "center",
      height: "50%",
    },
  },

  hintStyles: {
    hintTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginVertical: 20,
    },
    hintText: {
      fontSize: 18,
      marginTop: 10,
    },
    hintContainer: {
      marginTop: 20,
    },
  },

  uiButtonStyles: {
    button: {
      container: {
        justifyContent: "center",
        alignItems: "center",
      },
      text: {
        color: "white",
        fontWeight: "600",
        textAlign: "center",
      },
      disabled: {
        backgroundColor: "lightgrey",
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
  },
});
