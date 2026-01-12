import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CalendarPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
  };
}

export function CalendarPicker({ value, onChange, onClose, colors }: CalendarPickerProps) {
  // Ensure we're working with local dates to avoid timezone issues
  const getLocalDate = (date: Date) => {
    // Create date at local noon to avoid timezone edge cases
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  };
  
  const localValue = getLocalDate(value);
  const [currentMonth, setCurrentMonth] = useState(new Date(localValue.getFullYear(), localValue.getMonth(), 1, 0, 0, 0, 0));
  const [selectedDate, setSelectedDate] = useState(localValue);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    // Create date at local midnight to avoid timezone issues
    const year = date.getFullYear();
    const month = date.getMonth();
    // Use UTC methods to avoid any timezone shifts
    const firstDay = new Date(year, month, 1);
    // getDay() returns 0 (Sunday) to 6 (Saturday)
    return firstDay.getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    let newYear = year;
    let newMonth = month;
    
    if (direction === 'prev') {
      newMonth = month - 1;
      if (newMonth < 0) {
        newMonth = 11;
        newYear = year - 1;
      }
    } else {
      newMonth = month + 1;
      if (newMonth > 11) {
        newMonth = 0;
        newYear = year + 1;
      }
    }
    
    setCurrentMonth(new Date(newYear, newMonth, 1));
  };

  const handleDateSelect = (day: number, isCurrentMonth: boolean, isPrevMonth?: boolean, isNextMonth?: boolean) => {
    let year = currentMonth.getFullYear();
    let month = currentMonth.getMonth();
    
    if (isPrevMonth) {
      month = month - 1;
      if (month < 0) {
        month = 11;
        year = year - 1;
      }
    } else if (isNextMonth) {
      month = month + 1;
      if (month > 11) {
        month = 0;
        year = year + 1;
      }
    }
    
    // Create date in local timezone
    const newDate = new Date(year, month, day);
    // Set time to noon to avoid timezone issues
    newDate.setHours(12, 0, 0, 0);
    setSelectedDate(newDate);
    onChange(newDate);
    
    // Update current month if navigating to prev/next month
    if (!isCurrentMonth) {
      setCurrentMonth(new Date(year, month, 1));
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    return (
      day === todayDate &&
      currentMonth.getMonth() === todayMonth &&
      currentMonth.getFullYear() === todayYear
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfWeek = getFirstDayOfMonth(currentMonth); // 0=Sunday, 1=Monday, ..., 6=Saturday
  
  // Verify: For Jan 2026, firstDayOfWeek should be 4 (Thursday)
  // console.log(`Calendar Debug - Month: ${currentMonth.getMonth() + 1}/${currentMonth.getFullYear()}, First day of week: ${firstDayOfWeek} (${dayNames[firstDayOfWeek]})`);
  
  const days: Array<{ day: number; isCurrentMonth: boolean; isPrevMonth?: boolean; isNextMonth?: boolean }> = [];

  // Get previous month info
  let prevMonthYear = currentMonth.getFullYear();
  let prevMonthIndex = currentMonth.getMonth() - 1;
  if (prevMonthIndex < 0) {
    prevMonthIndex = 11;
    prevMonthYear -= 1;
  }
  const daysInPrevMonth = getDaysInMonth(new Date(prevMonthYear, prevMonthIndex, 1));
  
  // Add days from previous month to fill the first week
  // firstDayOfWeek tells us how many cells we need before day 1
  // Example: If Jan 1 is Thursday (firstDayOfWeek = 4), we need 4 cells: Sun, Mon, Tue, Wed
  // Those should show: Dec 28, 29, 30, 31 (if December has 31 days)
  const startPrevMonthDay = daysInPrevMonth - firstDayOfWeek + 1;
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({
      day: startPrevMonthDay + i,
      isCurrentMonth: false,
      isPrevMonth: true,
    });
  }

  // Add days of the current month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      day,
      isCurrentMonth: true,
    });
  }

  // Fill remaining cells with next month's days to complete the grid (6 rows = 42 cells)
  const remainingCells = 42 - days.length;
  for (let day = 1; day <= remainingCells; day++) {
    days.push({
      day,
      isCurrentMonth: false,
      isNextMonth: true,
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Month Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
          <Text style={[styles.navButtonText, { color: colors.primary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: colors.text }]}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
          <Text style={[styles.navButtonText, { color: colors.primary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day Names */}
      <View style={styles.dayNamesContainer}>
        {dayNames.map((day) => (
          <View key={day} style={styles.dayNameCell}>
            <Text style={[styles.dayNameText, { color: colors.textSecondary }]}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGridContainer}>
        <View style={styles.calendarGrid}>
          {days.map((dayData, index) => {
          const { day, isCurrentMonth, isPrevMonth, isNextMonth } = dayData;
          const isTodayDate = isCurrentMonth && isToday(day);
          const isSelectedDate = isCurrentMonth && isSelected(day);
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isTodayDate && { backgroundColor: colors.primary + '20' },
                isSelectedDate && { backgroundColor: colors.primary },
              ]}
              onPress={() => handleDateSelect(day, isCurrentMonth, isPrevMonth, isNextMonth)}
            >
              <Text
                style={[
                  styles.dayText,
                  !isCurrentMonth && { color: colors.textSecondary, opacity: 0.4 },
                  isCurrentMonth && { color: colors.text },
                  isTodayDate && { fontWeight: 'bold' },
                  isSelectedDate && { color: '#fff', fontWeight: 'bold' },
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
          })}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            const today = new Date();
            setSelectedDate(today);
            setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            onChange(today);
          }}
        >
          <Text style={styles.actionButtonText}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.border }]}
          onPress={onClose}
        >
          <Text style={[styles.actionButtonText, { color: colors.text }]}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
  },
  dayNamesContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 2, // Match dayCell left/right margin
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGridContainer: {
    marginBottom: 20,
    paddingHorizontal: 2, // Match dayCell left/right margin to align with day names
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
    marginHorizontal: 0, // No horizontal margin since container has padding
  },
  dayText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
