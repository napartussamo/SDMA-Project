import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Platform, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';



const getRiskInfo = (score: number) => {
  if (score <= 29) {
    return { label: 'ข้อความปลอดภัย', color: '#4CAF50' };
  }
  if (score <= 59) {
    return { label: 'ข้อความน่าสงสัย', color: '#FFEB3B' };
  }
  return { label: 'ข้อความอันตราย', color: '#F44336' };
};

const RiskScoreScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const { risk_score, message } = route.params;
    const risk = getRiskInfo(risk_score);
  

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
            </TouchableOpacity>
        </View>
        <View style={styles.content}>
            <View style={[styles.circle, { backgroundColor: risk.color }]} />

            <Text style={styles.title}>{risk.label}</Text>
            <Text style={styles.score}>
                คะแนนความเสี่ยงของข้อความ : {risk_score}
            </Text>
            <Text style={styles.note}>
                * ผลการตรวจสอบใช้สำหรับอ้างอิงเท่านั้น
            </Text>

            <View style={styles.table}>
            <Text style={styles.tableTitle}>คะแนนความเสี่ยง</Text>

            <View style={styles.tableRow}>
                <Text style={styles.leftCol}>0–29</Text>
                <Text style={styles.rightCol}>ข้อความปลอดภัย</Text>
            </View>

            <View style={styles.tableRow}>
                <Text style={styles.leftCol}>30–59</Text>
                <Text style={styles.rightCol}>ข้อความน่าสงสัย</Text>
            </View>

            <View style={styles.tableRow}>
                <Text style={styles.leftCol}>60–100</Text>
                <Text style={styles.rightCol}>ข้อความอันตราย</Text>
            </View>
            </View>


            <Text style={styles.note}>
                * อ้างอิงจาก Spam Detection and Risk Assessment Framework 
Based on Ensemble Learning in Data Stream Environment 
โดย Adewole, Jimoh, Akintola, & Abikoye, 2018  
            </Text>

        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 ,backgroundColor: '#fff'},
  header: {backgroundColor: '#fff',
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      paddingBottom: 10,},
    content: {alignItems: 'center'},
  circle: { width: 80, height: 80, borderRadius: 40, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  score: { fontSize: 16, marginBottom: 7 },
  table: {
  width: '100%',
  backgroundColor: '#eee',
  borderRadius: 12,
  padding: 12,
  marginVertical: 12,
},

tableTitle: {
  textAlign: 'center',
  fontWeight: 'bold',
  marginBottom: 8,
},

tableRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingVertical: 6,
},

leftCol: {
  fontSize: 14,
  color: '#000',
},

rightCol: {
  fontSize: 14,
  color: '#000',
},

  note: { fontSize: 12, color: '#666', marginBottom: 12 },
  message: { marginTop: 16, fontStyle: 'italic' },
});

export default RiskScoreScreen;
