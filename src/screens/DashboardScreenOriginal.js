import React, {useState} from 'react';
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const DashboardScreenOriginal = ({onNavigateToGTD, onAddTask, tasks, onToggleTask}) => {
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const generateCalendarDays = date => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      days.push({
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === today.toDateString(),
      });
    }

    return days;
  };

  // Filter tasks for today section only
  const todayTasks = tasks ? tasks.filter(task => task.section === 'today') : [];

  const completedCount = todayTasks.filter(task => task.completed).length;
  const totalCount = todayTasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        scrollEnabled={true}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={() => {
            console.log('Menu button pressed, onNavigateToGTD:', onNavigateToGTD);
            console.log('About to call onNavigateToGTD...');
            try {
              onNavigateToGTD();
              console.log('onNavigateToGTD called successfully');
            } catch (error) {
              console.log('Error calling onNavigateToGTD:', error);
            }
          }}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            // onPress={() => navigation.navigate('CalendarScreen')}
          >
            <Image
              source={{uri: 'https://i.pravatar.cc/40'}}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>

        {/* Progress Circle */}
        <View style={styles.progressContainer}>
          <View style={styles.progressCircle}>
            <View style={styles.progressInner}>
              <Text style={styles.progressText}>{completionPercentage}%</Text>
              <Text style={styles.progressLabel}>Complete</Text>
            </View>
          </View>
        </View>

        {/* Motivational Message */}
        <Text style={styles.motivationalText}>
          ¡Impresionante! Estás en racha. 🔥
        </Text>

        {/* Today Section */}
        <View style={styles.todaySection}>
          <View style={styles.todayHeader}>
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={() => setIsCalendarVisible(true)}>
              <Text style={styles.calendarDate}>{selectedDate.getDate()}</Text>
              <Text style={styles.calendarDay}>
                {selectedDate
                  .toLocaleDateString('en-US', {month: 'short'})
                  .toUpperCase()}
              </Text>
            </TouchableOpacity>

            <Text style={styles.todayLabel}>Today</Text>

            <TouchableOpacity style={styles.moreButton}>
              <Text style={styles.moreButtonText}>⋯</Text>
            </TouchableOpacity>
          </View>

          {/* Tasks List */}
          <View style={styles.tasksList}>
            {todayTasks.map(task => (
              <TouchableOpacity key={task.id} style={styles.taskItem}>
                <TouchableOpacity
                  style={[
                    styles.taskCheckbox,
                    task.completed && styles.taskCheckboxCompleted,
                  ]}
                  onPress={() => onToggleTask && onToggleTask(task.id, task.completed)}
                >
                  {task.completed && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                <Text
                  style={[
                    styles.taskText,
                    task.completed && styles.taskTextCompleted,
                  ]}>
                  {task.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Add Quick Task Button */}
        <TouchableOpacity style={styles.addTaskButton} onPress={onAddTask}>
          <Text style={styles.addTaskText}>+ Add Quick Task</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={isCalendarVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCalendarVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate.toLocaleDateString('es-ES', {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <TouchableOpacity
                onPress={() => setIsCalendarVisible(false)}
                style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekDays}>
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <Text key={day} style={styles.weekDayText}>
                  {day}
                </Text>
              ))}
            </View>

            <FlatList
              data={generateCalendarDays(selectedDate)}
              numColumns={7}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.dayCell,
                    item.isCurrentMonth
                      ? styles.currentMonth
                      : styles.otherMonth,
                    item.isToday ? styles.today : null,
                  ]}
                  onPress={() => {
                    if (item.isCurrentMonth) {
                      setSelectedDate(
                        new Date(
                          selectedDate.getFullYear(),
                          selectedDate.getMonth(),
                          item.day,
                        ),
                      );
                      setIsCalendarVisible(false);
                    }
                  }}>
                  <Text
                    style={[
                      styles.dayText,
                      item.isCurrentMonth
                        ? styles.currentMonthText
                        : styles.otherMonthText,
                      item.isToday ? styles.todayText : null,
                    ]}>
                    {item.day}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A90E2',
  },
  scrollView: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  menuButton: {
    padding: 10,
  },
  menuLine: {
    width: 24,
    height: 3,
    backgroundColor: 'white',
    marginVertical: 2,
    borderRadius: 2,
  },
  profileButton: {
    padding: 5,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  progressCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRightColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{rotate: '-45deg'}],
  },
  progressInner: {
    transform: [{rotate: '45deg'}],
    alignItems: 'center',
  },
  progressText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  progressLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  motivationalText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 18,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  todaySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  calendarButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  calendarDate: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  calendarDay: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  todayLabel: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  moreButton: {
    padding: 10,
  },
  moreButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  tasksList: {
    space: 15,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCheckboxCompleted: {
    backgroundColor: 'white',
    borderColor: 'white',
  },
  checkmark: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskText: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  addTaskButton: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  addTaskText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Calendar Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDayText: {
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    flex: 1,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
  },
  currentMonth: {
    backgroundColor: '#f8f9fa',
  },
  otherMonth: {
    backgroundColor: 'transparent',
  },
  today: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  dayText: {
    fontSize: 16,
    textAlign: 'center',
  },
  currentMonthText: {
    color: '#333',
  },
  otherMonthText: {
    color: '#ccc',
  },
  todayText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DashboardScreenOriginal;
