import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ImageBackground,
  Pressable,
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
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  Layout,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../../src/services/firebaseConfig";

export default function Dashboard() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [homeworks, setHomeworks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const menuHeight = useSharedValue(0);
  const menuOpacity = useSharedValue(0);
  const menuRotation = useSharedValue(0);

  const toggleMenu = () => {
    const willOpen = !menuOpen;
    setMenuOpen(willOpen);
    menuHeight.value = withTiming(willOpen ? 120 : 0, { duration: 300 });
    menuOpacity.value = withTiming(willOpen ? 1 : 0, { duration: 300 });
    menuRotation.value = withTiming(willOpen ? 45 : 0, { duration: 300 });
  };

  const menuStyle = useAnimatedStyle(() => ({
    height: menuHeight.value,
    opacity: menuOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${menuRotation.value}deg` }],
  }));

  const router = useRouter();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(scrollY.value, [0, 100], [100, 60], Extrapolate.CLAMP);
    const opacity = interpolate(scrollY.value, [0, 100], [1, 0.8], Extrapolate.CLAMP);
    return { height, opacity };
  });

  // ✅ Firestore listener
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "homeworks"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      setHomeworks(data);
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
          description,
          dueDate: dueDate.toISOString(),
        });
        setEditingId(null);
        Alert.alert("Updated", "Homework updated");
      } else {
        await addDoc(collection(db, "homeworks"), {
          title,
          description,
          dueDate: dueDate.toISOString(),
          userId: auth.currentUser.uid,
          createdAt: new Date(),
        });
        Alert.alert("Added", "Homework added");
      }
      setTitle("");
      setDescription("");
      setDueDate(new Date());
    } catch (err) {
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "homeworks", id));
      Alert.alert("Deleted", "Homework removed");
    } catch (err) {
      Alert.alert("Error", "Could not delete");
    }
  };

  const handleEdit = (item) => {
    setTitle(item.title);
    setDescription(item.description || "");
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

  // ✅ Filtered + sorted homeworks
  const filteredHomeworks = homeworks
    .filter(
      (hw) =>
        hw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (hw.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // ✅ Function to get due date color
  const getDueDateColor = (dueDateStr) => {
    const now = new Date();
    const due = new Date(dueDateStr);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "#e53935"; // overdue
    if (diffDays <= 7) return "#fb8c00"; // within a week
    return "#43a047"; // more than 7 days
  };

  // ✅ Function to get countdown text
  const getCountdownText = (dueDateStr) => {
    const now = new Date();
    const due = new Date(dueDateStr);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return ` Overdue by ${Math.abs(diffDays)} day(s)`;
    if (diffDays === 0) return ` Due today!`;
    if (diffDays === 1) return ` Due tomorrow`;
    return ` ${diffDays} days left`;
  };

  return (
    <ImageBackground
      source={
        darkMode
          ? require("../../assets/images/night.gif")
          : require("../../assets/images/day.gif")
      }
      style={{ flex: 1, width: "100%", height: "100%" }}
      resizeMode="cover"
    >
      <View style={{ flex: 1 }}>
        {/* Animated Header */}
        <Animated.View style={[headerAnimatedStyle, { zIndex: 2000 }]}>
          <BlurView
            intensity={40}
            tint={darkMode ? "dark" : "light"}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 16,
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              flex: 1,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "bold",
                color: darkMode ? "#fff" : "#000",
              }}
            >
              My Homework
            </Text>

            {/* ☰ Dropdown Menu */}
            <View style={{ position: "relative", zIndex: 3000 }}>
              <Pressable onPress={toggleMenu}>
                <Animated.View style={iconStyle}>
                  <Ionicons
                    name="menu"
                    size={28}
                    color={darkMode ? "#fff" : "#000"}
                  />
                </Animated.View>
              </Pressable>

              {/* Overlay with fade */}
              {menuOpen && (
                <Animated.View
                  style={[
                    {
                      position: "absolute",
                      top: -2000,
                      left: -2000,
                      right: -2000,
                      bottom: -2000,
                      backgroundColor: "rgba(0,0,0,0.4)",
                      zIndex: 2500,
                    },
                    { opacity: menuOpacity },
                  ]}
                >
                  <Pressable style={{ flex: 1 }} onPress={toggleMenu} />
                </Animated.View>
              )}

              {/* Dropdown */}
              <Animated.View
                style={[
                  {
                    position: "absolute",
                    top: 40,
                    right: 0,
                    width: 180,
                    borderRadius: 12,
                    overflow: "hidden",
                    backgroundColor: darkMode ? "#333" : "#f9f9f9",
                    shadowColor: "#000",
                    shadowOpacity: 0.2,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 5,
                    elevation: 8,
                    zIndex: 3001,
                  },
                  menuStyle,
                ]}
              >
                {/* Dark Mode Toggle */}
                <Pressable
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    padding: 12,
                  }}
                  onPress={() => {
                    setDarkMode(!darkMode);
                    toggleMenu();
                  }}
                >
                  <Text style={{ color: darkMode ? "#fff" : "#000" }}>
                    {darkMode ? " Dark Mode" : " Light Mode"}
                  </Text>
                </Pressable>

                {/* Logout */}
                <Pressable
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 12,
                  }}
                  onPress={() => {
                    toggleMenu();
                    handleLogout();
                  }}
                >
                  <Ionicons
                    name="log-out"
                    size={20}
                    color={darkMode ? "#fff" : "#000"}
                  />
                  <Text
                    style={{
                      marginLeft: 8,
                      color: darkMode ? "#fff" : "#000",
                    }}
                  >
                    Logout
                  </Text>
                </Pressable>
              </Animated.View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Homework List */}
        <Animated.FlatList
          data={filteredHomeworks}
          keyExtractor={(item) => item.id}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          ListHeaderComponent={
            <>
              {/* Search Bar */}
              <BlurView
                intensity={30}
                tint={darkMode ? "dark" : "light"}
                style={{
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  margin: 16,
                  overflow: "hidden",
                }}
              >
                <TextInput
                  placeholder="Search homework..."
                  placeholderTextColor={darkMode ? "#aaa" : "#555"}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{ fontSize: 16, color: darkMode ? "#fff" : "#000" }}
                />
              </BlurView>

              {/* Input Card */}
              <BlurView
                intensity={40}
                tint={darkMode ? "dark" : "light"}
                style={{
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  marginHorizontal: 16,
                  marginBottom: 16,
                  overflow: "hidden",
                }}
              >
                <TextInput
                  placeholder="Homework Title..."
                  placeholderTextColor={darkMode ? "#aaa" : "#555"}
                  value={title}
                  onChangeText={setTitle}
                  style={{
                    fontSize: 16,
                    color: darkMode ? "#fff" : "#000",
                    marginBottom: 10,
                    borderBottomWidth: 1,
                    borderColor: "#ccc",
                    paddingBottom: 6,
                  }}
                />

                <TextInput
                  placeholder="Description..."
                  placeholderTextColor={darkMode ? "#aaa" : "#555"}
                  value={description}
                  onChangeText={setDescription}
                  style={{
                    fontSize: 14,
                    color: darkMode ? "#fff" : "#000",
                    marginBottom: 10,
                    borderBottomWidth: 1,
                    borderColor: "#ccc",
                    paddingBottom: 6,
                  }}
                  multiline
                />

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: darkMode ? "#333" : "#f0f0f0",
                      marginRight: 10,
                    }}
                    onPress={() => setShowPicker(true)}
                  >
                    <Text style={{ fontSize: 14, color: darkMode ? "#fff" : "#333" }}>
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
                </View>
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
            </>
          }
          renderItem={({ item }) => (
            <Animated.View layout={Layout.springify()}>
              <BlurView
                intensity={30}
                tint={darkMode ? "dark" : "light"}
                style={{
                  borderRadius: 12,
                  padding: 16,
                  marginHorizontal: 16,
                  marginBottom: 12,
                  overflow: "hidden",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: darkMode ? "#fff" : "#222",
                  }}
                >
                  {item.title}
                </Text>

                {item.description ? (
                  <View>
                    <Animated.Text
                      numberOfLines={expandedId === item.id ? undefined : 2}
                      style={{
                        fontSize: 14,
                        color: darkMode ? "#ddd" : "#555",
                        marginTop: 4,
                      }}
                    >
                      {item.description}
                    </Animated.Text>

                    <TouchableOpacity
                      onPress={() =>
                        setExpandedId(expandedId === item.id ? null : item.id)
                      }
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#1976d2",
                          marginTop: 2,
                        }}
                      >
                        {expandedId === item.id ? "Show less ▲" : "Read more ▼"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: getDueDateColor(item.dueDate),
                    marginTop: 8,
                  }}
                >
                   Due: {new Date(item.dueDate).toDateString()}
                </Text>

                <Text
                  style={{
                    fontSize: 13,
                    color: getDueDateColor(item.dueDate),
                    marginTop: 2,
                  }}
                >
                  {getCountdownText(item.dueDate)}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    marginTop: 8,
                  }}
                >
                  <TouchableOpacity onPress={() => handleEdit(item)}>
                    <Text style={{ marginRight: 16, color: "#1976d2" }}> Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Text style={{ color: "#d32f2f" }}> Delete</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </Animated.View>
          )}
          ListEmptyComponent={
            <Text
              style={{
                textAlign: "center",
                marginTop: 30,
                color: darkMode ? "#fff" : "#000",
              }}
            >
              No homework yet. Add one!
            </Text>
          }
        />
      </View>
    </ImageBackground>
  );
}
