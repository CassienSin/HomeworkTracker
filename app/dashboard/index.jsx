import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Platform,
  Switch,
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
import { db, auth } from "../../src/services/firebaseConfig";

export default function Dashboard() {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [homeworks, setHomeworks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const router = useRouter();

  // ✅ Real-time listener for user’s homework
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
    <View
      style={[
        styles.container,
        { backgroundColor: darkMode ? "#121212" : "#f5f5f5" },
      ]}
    >
      {/* Top bar with menu */}
      <View style={styles.topBar}>
        <Text style={[styles.title, { color: darkMode ? "#fff" : "#333" }]}>
          My Homework
        </Text>
        <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
          <Text style={styles.menuButton}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu */}
      {showMenu && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              Alert.alert("Profile", "Profile clicked!");
            }}
          >
            <Text style={styles.menuText}>👤 Profile</Text>
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <Text style={styles.menuText}>⚙️ Dark Mode</Text>
            <Switch value={darkMode} onValueChange={setDarkMode} />
          </View>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={[styles.menuText, { color: "#c62828" }]}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input Card like Google Reminder */}
      <View
        style={[
          styles.addCard,
          { backgroundColor: darkMode ? "#1e1e1e" : "#fff" },
        ]}
      >
        <TextInput
          placeholder="Add homework..."
          placeholderTextColor={darkMode ? "#aaa" : "#999"}
          value={title}
          onChangeText={setTitle}
          style={[
            styles.input,
            { color: darkMode ? "#fff" : "#333" },
          ]}
        />

        <TouchableOpacity
          style={[
            styles.dateButton,
            { backgroundColor: darkMode ? "#333" : "#f0f0f0" },
          ]}
          onPress={() => setShowPicker(true)}
        >
          <Text style={{ color: darkMode ? "#fff" : "#333" }}>
            {dueDate.toDateString()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: darkMode ? "#66bb6a" : "#4caf50" }]}
          onPress={handleSaveHomework}
        >
          <Text style={styles.addButtonText}>＋</Text>
        </TouchableOpacity>
      </View>

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
          <View
            style={[
              styles.card,
              { backgroundColor: darkMode ? "#1e1e1e" : "#fff" },
            ]}
          >
            <Text
              style={[
                styles.cardTitle,
                { color: darkMode ? "#fff" : "#333" },
              ]}
            >
              {item.title}
            </Text>
            <Text
              style={[
                styles.cardDate,
                { color: darkMode ? "#aaa" : "#555" },
              ]}
            >
              Due: {new Date(item.dueDate).toDateString()}
            </Text>
            <View style={styles.cardButtons}>
              <TouchableOpacity onPress={() => handleEdit(item)}>
                <Text style={styles.editText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text
            style={[
              styles.emptyText,
              { color: darkMode ? "#aaa" : "#888" },
            ]}
          >
            No homework yet. Add one!
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: "bold" },
  menuButton: { fontSize: 22, color: "#666", paddingHorizontal: 10 },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuText: { fontSize: 16, color: "#333" },

  addCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  input: { flex: 1, fontSize: 16 },
  dateButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: { color: "#fff", fontSize: 22, fontWeight: "bold" },

  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold" },
  cardDate: { fontSize: 14, marginTop: 4 },
  cardButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  editText: { marginRight: 16, color: "#1976d2", fontWeight: "600" },
  deleteText: { color: "#d32f2f", fontWeight: "600" },
  emptyText: { textAlign: "center", marginTop: 30, fontSize: 15 },
});
