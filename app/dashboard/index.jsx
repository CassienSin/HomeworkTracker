import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  ImageBackground,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { db, auth } from "../../src/services/firebaseConfig";

export default function Dashboard() {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [homeworks, setHomeworks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const router = useRouter();

  // ✅ Real-time listener
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "homeworks"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setHomeworks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return unsub;
  }, []);

  // ✅ Add or Update homework
  const handleSaveHomework = async () => {
    if (!title) {
      Alert.alert("Error", "Please enter a title!");
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, "homeworks", editingId), {
          title,
          dueDate: dueDate.toISOString(),
        });
        setEditingId(null);
        Alert.alert("Updated", "Homework updated ✅");
      } else {
        await addDoc(collection(db, "homeworks"), {
          title,
          dueDate: dueDate.toISOString(),
          userId: auth.currentUser.uid,
          createdAt: new Date(),
        });
        Alert.alert("Added", "Homework added ✅");
      }
      setTitle("");
      setDueDate(new Date());
    } catch (err) {
      Alert.alert("Error", "Something went wrong ❌");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "homeworks", id));
      Alert.alert("Deleted", "Homework removed 🗑️");
    } catch (err) {
      Alert.alert("Error", "Could not delete ❌");
    }
  };

  const handleEdit = (item) => {
    setTitle(item.title);
    setDueDate(new Date(item.dueDate));
    setEditingId(item.id);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (err) {
      Alert.alert("Logout Error", err.message);
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/background.gif")}
      style={{ flex: 1, width: "100%", height: "100%" }}
      resizeMode="cover"
    >
      <View style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <BlurView
          intensity={40}
          tint="dark"
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            borderRadius: 12,
            padding: 12,
            overflow: "hidden",
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "bold", color: "#fff" }}>
            My Homework
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              paddingVertical: 6,
              paddingHorizontal: 14,
              borderRadius: 8,
            }}
            onPress={handleLogout}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Logout</Text>
          </TouchableOpacity>
        </BlurView>

        {/* Input Card */}
        <BlurView
          intensity={40}
          tint="light"
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 16,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginBottom: 16,
            overflow: "hidden",
          }}
        >
          <TextInput
            placeholder="Add homework..."
            placeholderTextColor="#aaa"
            value={title}
            onChangeText={setTitle}
            style={{ flex: 1, fontSize: 16, color: "#333" }}
          />

          <TouchableOpacity
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: "#f0f0f0",
              marginRight: 10,
            }}
            onPress={() => setShowPicker(true)}
          >
            <Text style={{ fontSize: 14, color: "#333" }}>
              {dueDate.toDateString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#43e97b",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={handleSaveHomework}
          >
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}>
              {editingId ? "✔" : "＋"}
            </Text>
          </TouchableOpacity>
        </BlurView>

        {showPicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              setShowPicker(false);
              if (selectedDate) setDueDate(selectedDate);
            }}
          />
        )}

        {/* Homework list */}
        <FlatList
          data={homeworks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BlurView
              intensity={30}
              tint="light"
              style={{
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                overflow: "hidden",
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "bold", color: "#222" }}
              >
                {item.title}
              </Text>
              <Text style={{ fontSize: 14, color: "#444", marginTop: 4 }}>
                Due: {new Date(item.dueDate).toDateString()}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  marginTop: 8,
                }}
              >
                <TouchableOpacity onPress={() => handleEdit(item)}>
                  <Text style={{ marginRight: 16, color: "#1976d2" }}>
                    ✏️ Edit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={{ color: "#d32f2f" }}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 30, color: "#fff" }}>
              No homework yet. Add one!
            </Text>
          }
        />
      </View>
    </ImageBackground>
  );
}
