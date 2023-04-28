import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, Modal } from 'react-native';
import {useSharedStates} from './sharedStates'

export default function GroupScreen(props) {
  // import shared States
  const {points, fragen, aktuelleFrage} = useSharedStates();

  return (
    <View style={styles.container}>
    <View style={styles.section}>
    <Text style={styles.sectionTitle}>Bestätigte Gruppe</Text>
    <View style={styles.row}>
      <Text style={styles.label}>Gruppen Name:</Text>
      <Text style={styles.value}>{props.confirmedGroup}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Mitglieder:</Text>
      <Text style={styles.value}>{props.confirmedGroupMembers}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Beantwortete Fragen</Text>
      <Text style={styles.value}>{aktuelleFrage} von {fragen.length}</Text>
    </View>
    <View style={styles.row}>
      <Text style={styles.label}>Aktuelle Punktzahl:</Text>
      <Text style={styles.value}>{points}</Text>
    </View>
    </View>
    </View>
    );
    }
    
    const styles = StyleSheet.create({
    container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    },
    modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    },
    modalText: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    },
    inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    },
    input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    },
    answerContainer: {
    marginTop: 20,
    alignItems: 'center',
    },
    answerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    },
    answer: {
    fontSize: 16,
    },
    section: {
      marginTop: 20,
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 20,
      width: '100%',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
    label: {
      fontSize: 16,
      color: '#666',
      marginRight: 5,
    },
    value: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    });