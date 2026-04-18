import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function App() {

  const [trips, setTrips] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [clients, setClients] = useState({});

  const [tripName, setTripName] = useState("");
  const [selectedTrip, setSelectedTrip] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    number: "",
    phone: "",
    city: "",
    branch: ""
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const t = JSON.parse(await AsyncStorage.getItem("trips")) || [];
    const p = JSON.parse(await AsyncStorage.getItem("parcels")) || [];
    const c = JSON.parse(await AsyncStorage.getItem("clients")) || {};

    setTrips(t.map(x => typeof x === "string" ? {name:x, closed:false} : x));
    setParcels(p);
    setClients(c);
  };

  const save = async (t,p,c) => {
    await AsyncStorage.setItem("trips", JSON.stringify(t));
    await AsyncStorage.setItem("parcels", JSON.stringify(p));
    await AsyncStorage.setItem("clients", JSON.stringify(c));
  };

  const createTrip = () => {
    if(!tripName) return;
    if(trips.find(t=>t.name===tripName)) return;

    const t = [...trips, {name:tripName, closed:false}];
    setTrips(t);
    save(t, parcels, clients);
    setTripName("");
  };

  const toggleTrip = () => {
    const t = trips.map(x =>
      x.name===selectedTrip ? {...x, closed:!x.closed} : x
    );
    setTrips(t);
    save(t, parcels, clients);
  };

  const addParcel = () => {
    const trip = trips.find(t=>t.name===selectedTrip);

    if(!trip) return Alert.alert("Створи рейс");
    if(trip.closed) return Alert.alert("Рейс закритий");

    const p = {
      id: Date.now().toString(),
      trip: selectedTrip,
      ...form
    };

    const newParcels = [...parcels, p];

    const newClients = {
      ...clients,
      [form.phone]: {
        fullName: form.fullName,
        city: form.city,
        branch: form.branch
      }
    };

    setParcels(newParcels);
    setClients(newClients);
    save(trips, newParcels, newClients);

    setForm({fullName:"",number:"",phone:"",city:"",branch:""});
  };

  const filtered = parcels
    .filter(p=>p.trip===selectedTrip)
    .sort((a,b)=>parseInt(a.number)-parseInt(b.number));

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Посилки</Text>

      <TextInput placeholder="Назва рейсу" value={tripName} onChangeText={setTripName} style={styles.input}/>
      <Button title="Створити рейс" onPress={createTrip}/>

      <FlatList
        horizontal
        data={trips}
        renderItem={({item})=>(
          <TouchableOpacity onPress={()=>setSelectedTrip(item.name)} style={styles.trip}>
            <Text>{item.name} {item.closed?"🔒":""}</Text>
          </TouchableOpacity>
        )}
      />

      <Button title="Закрити / Відкрити" onPress={toggleTrip}/>

      <TextInput placeholder="Телефон" value={form.phone}
        onChangeText={t=>{
          setForm({...form, phone:t});
          if(clients[t]){
            setForm({
              ...form,
              phone:t,
              fullName:clients[t].fullName,
              city:clients[t].city,
              branch:clients[t].branch
            });
          }
        }}
        style={styles.input}
      />

      <TextInput placeholder="ПІБ" value={form.fullName} onChangeText={t=>setForm({...form,fullName:t})} style={styles.input}/>
      <TextInput placeholder="Номер" value={form.number} onChangeText={t=>setForm({...form,number:t})} style={styles.input}/>
      <TextInput placeholder="Місто" value={form.city} onChangeText={t=>setForm({...form,city:t})} style={styles.input}/>
      <TextInput placeholder="Відділення" value={form.branch} onChangeText={t=>setForm({...form,branch:t})} style={styles.input}/>

      <Button title="Додати" onPress={addParcel}/>

      <FlatList
        data={filtered}
        renderItem={({item})=>(
          <View style={styles.card}>
            <Text>{item.number} | {item.fullName}</Text>
            <Text>{item.city}</Text>
          </View>
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container:{padding:20,marginTop:40},
  title:{fontSize:22},
  input:{borderWidth:1,padding:10,marginVertical:5,borderRadius:8},
  trip:{background:"#ddd",padding:10,margin:5,borderRadius:8},
  card:{background:"#fff",padding:10,marginVertical:5,borderRadius:8}
});
