import React, { useState } from "react";
import { Pressable, StyleSheet, View, Alert } from "react-native";
import { ThemedText } from "../ThemedText";
import dayjs, { Dayjs } from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSame from 'dayjs'

dayjs.extend(isSameOrBefore);
dayjs.extend(isSame);

export interface WeekViewProps {
  from: Dayjs;
  offerDays: string[];
  orderDays: string[];
}

interface MonthDay {
  day: string;
  date: string;
  today: boolean;
  offer: boolean;
  order: boolean;
  isCurrentMonth: boolean;
}

const blue = "#0070ff";
const lightBlue = "#4688eb";
const orange = "#ffaa2a";

export const DayFormat = "YYYY-MM-DD";

export default function MonthView({
  from,
  orderDays,
  offerDays,
}: WeekViewProps) {
  const [width, setWidth] = useState<number>(0);
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(from);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => prev.subtract(1, 'month'));
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => prev.add(1, 'month'));
    setSelectedDay(null);
  };

  const handleOrder = async () => {
    if (!selectedDay) return;

    try {
      const response = await fetch('https://example.com/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDay,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        Alert.alert('Success', `Order placed for ${selectedDay}`);
      } else {
        Alert.alert('Error', 'Failed to place order');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error occurred');
      console.error('Order error:', error);
    }
  };

  const monthStart = dayjs(currentMonth).startOf("month");
  const monthEnd = dayjs(currentMonth).endOf("month");

  const firstMonday = dayjs(monthStart).startOf("week").add(1, 'day'); 
  const lastSunday = dayjs(monthEnd).endOf("week").add(1, 'day'); 

  const day = dayjs(firstMonday);
  const days: MonthDay[] = [];

  let currentDay = day;
  while (currentDay.isSameOrBefore(lastSunday)) {
    days.push({
      day: currentDay.format("DD"),
      date: currentDay.format(DayFormat),
      today: currentDay.isSame(dayjs(), "day"),
      offer: offerDays.includes(currentDay.format(DayFormat)),
      order: orderDays.includes(currentDay.format(DayFormat)),
      isCurrentMonth: currentDay.isSame(currentMonth, "month"),
    });

    currentDay = currentDay.add(1, "day");
  }

  const weeks: MonthDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const weekDayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <View style={styles.container}>
      <View style={styles.monthHeader}>
        <Pressable style={styles.navButton} onPress={goToPreviousMonth}>
          <ThemedText style={styles.navButtonText}>‹</ThemedText>
        </Pressable>
        
        <ThemedText style={styles.monthTitle}>
          {currentMonth.format("MMMM YYYY")}
        </ThemedText>
        
        <Pressable style={styles.navButton} onPress={goToNextMonth}>
          <ThemedText style={styles.navButtonText}>›</ThemedText>
        </Pressable>
      </View>

      <View
        style={styles.days}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        <View style={styles.weekHeader}>
          {weekDayNames.map((dayName) => (
            <View
              key={dayName}
              style={{
                width: width / 7,
                padding: 2,
              }}
            >
              <ThemedText style={styles.weekDayName}>{dayName[0]}</ThemedText>
            </View>
          ))}
        </View>

        {weeks.map((week, weekIndex) => (
          <View key={`week-${week[0]?.date || weekIndex}`} style={styles.weekRow}>
            {week.map((d) => (
              <View
                style={{
                  width: width / 7,
                  padding: 1,
                }}
                key={d.date}
              >
                <Pressable
                  style={{
                    ...styles.touchableBox,
                    ...(d.offer || !d.isCurrentMonth ? {} : styles.noOfferDay),
                    ...(d.isCurrentMonth ? {} : styles.otherMonthDay),
                    ...(d.today && d.isCurrentMonth
                      ? styles.todayBackground
                      : {}),
                    ...(selectedDay === d.date && d.isCurrentMonth
                      ? styles.selectedDay
                      : {}),
                  }}
                  onPress={() => {
                    if (d.isCurrentMonth) {
                      setSelectedDay(d.date);
                    }
                  }}
                >
                  <View style={styles.dayBox}>
                    {d.isCurrentMonth && (
                      <ThemedText
                        style={{
                        ...styles.dayText,
                        ...(d.today ? { fontWeight: "bold", color: blue } : {}),
                        ...(selectedDay === d.date ? { color: "#fff" } : {}),
                        ...(d.isCurrentMonth ? 
                          (d.offer ? { color: "#111" } : { color: "#888" }) : 
                          { color: "#999" }
                        ),
                      }}
                      >
                        {d.day}
                      </ThemedText>
                    )}
                    
                    {d.order && d.isCurrentMonth && (
                      <View style={[styles.status, styles.ordered]} />
                    )}
                    {d.offer && !d.order && d.isCurrentMonth && (
                      <View style={[styles.status, styles.added]} />
                    )}
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        ))}
      </View>

      {selectedDay && (
        <View style={styles.selectedDayInfo}>
          <ThemedText style={styles.selectedDayText}>
            Selected: {dayjs(selectedDay).format("MMMM DD, YYYY")}
          </ThemedText>
          <Pressable style={styles.orderButton} onPress={handleOrder}>
            <ThemedText style={styles.orderButtonText}>Order</ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#f8f9fa",
  },
  navButton: {
    padding: 10,
    backgroundColor: blue,
    borderRadius: 5,
    minWidth: 40,
    alignItems: "center",
  },
  navButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  selectedDayInfo: {
    padding: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  selectedDayText: {
    fontSize: 16,
    marginBottom: 10,
    color: "#333",
  },
  orderButton: {
    backgroundColor: blue,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  orderButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  status: {
    position: "absolute",
    borderRadius: 5,
    width: 15,
    aspectRatio: 1,
  },
  unavailable: {
    opacity: 0.5,
  },
  ordered: {
    top: -3,
    right: -3,
    backgroundColor: lightBlue,
  },
  orderedUnpaid: {
    top: -3,
    right: -3,
    backgroundColor: orange,
  },
  cancelled: {
    bottom: -3,
    left: -3,
    backgroundColor: "#666",
  },
  added: {
    bottom: -3,
    right: -3,
    backgroundColor: blue,
  },
  orderedText: {
    fontSize: 10,
    textAlign: "center",
    fontFamily: "poppins-bold",
    color: "#fff",
  },
  days: {
    marginVertical: 2,
    marginHorizontal: 2,
    alignSelf: "stretch",
  },
  weekHeader: {
    flexDirection: "row",
  },
  weekRow: {
    flexDirection: "row",
  },
  dayText: {
    textAlign: "center",
    fontSize: 13,
  },
  weekDayName: {
    textAlign: "center",
    color: "#aaa",
    fontFamily: "poppins-bold",
    textTransform: "uppercase",
    fontSize: 8,
  },
  selectedDay: {
    backgroundColor: blue,
    borderColor: blue,
  },
  today: {
    color: "#555",
  },
  todayBackground: {
    borderWidth: 1,
    borderRadius: 4,
    borderColor: blue,
  },
  touchableBox: {
    backgroundColor: "#f6f6f6",
    aspectRatio: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#f6f6f6",
    justifyContent: "center",
  },
  dayBox: {
    justifyContent: "center",
    marginHorizontal: 0,
  },
  otherMonthDay: {
    backgroundColor: "#f0f0f0",
    borderColor: "#f0f0f0",
    opacity: 0.4,
  },
  noOfferDay: {
    opacity: 0.4,
  },
  otherMonthText: {
    color: "#ccc",
  },
});