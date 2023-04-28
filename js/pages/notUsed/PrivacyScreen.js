/* not used for first Version, privacy sheet by ralley organizer. Could be used in the future if server at DHBW is used. */

/* page vor simple privacy agreement */

const PrivacyScreen = ({navigation}) => {
    const [isEnabled, setIsEnabled] = useState(false);
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);
  
    const [shouldShow, setShouldShow] = useState(false);
  
    return (
      /* View is a Container vor content. Only one View per "return"/page available, but it's possible to use multiple Views in that View as children.*/
      <View style={styles.container}> 
        <View style={styles.contentView}>
          <Text style={styles.ownText}>Hiermit akzeptiere ich, dass Bildmaterial von mir gespeichert und auch bei der Ergebnisrunde gezeigt werden darf (oder so ähnlich)</Text>
          <View style = {styles.switchcontainer}>
            <Switch
              trackColor={{ false: "grey", true: "red" }} 
              onValueChange={toggleSwitch} 
              value={isEnabled}
              thumbColor={"#f4f3f4"}
            />
            <Text style={styles.ownText}>Ich akzeptiere.</Text>
          </View>
  
          {/* Text to show if switch disabled and button pressed */}
          {shouldShow ? <Text style={styles.warningMessage}>Bitte akzeptieren</Text>:null}
          <Button 
            title='Bestätigen' 
            color='red' 
            onPress={() => {isEnabled ? navigation.navigate('Willkommen') : setShouldShow(true)}} /* navigation function of NavigarionContainer in App()*/
            /* TO DO for later: save privacy agreement for user*/
          />
        </View>
      </View>
    );
  }
  