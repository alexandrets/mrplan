import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import CustomModal from '../common/CustomModal';

const EventModal = ({isVisible, onDisable, onClose, content}) => {
  return (
    <CustomModal
      backdropOpacity={0.8}
      isVisible={isVisible}
      onDisable={onDisable}>
      <View style={styles.mainContainer}>
        <Text style={styles.header}>Events</Text>

        {content && content.length > 0 ? (
          content.slice(0, 3).map((event, index) => {
            const start = new Date(event.start.dateTime).toLocaleString();
            const end = new Date(event.end.dateTime).toLocaleString();
            return (
              <View key={event.id || index} style={styles.eventBox}>
                <Text style={styles.title}>{event.summary || 'No Title'}</Text>
                {event.description && (
                  <Text style={styles.description}>
                    Description: {event.description}
                  </Text>
                )}
                <Text style={styles.time}>Start: {start}</Text>
                <Text style={styles.time}>End: {end}</Text>
                {event.creator?.email && (
                  <Text style={styles.creator}>Created by: {event.creator.email}</Text>
                )}
              </View>
            );
          })
        ) : (
          <Text style={styles.noEvents}>No events available.</Text>
        )}

        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </CustomModal>
  );
};

export default EventModal;

const styles = StyleSheet.create({
  mainContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 24,
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2C3E50',
  },
  eventBox: {
    marginBottom: 15,
    backgroundColor: '#F4F6F8',
    padding: 15,
    borderRadius: 10,
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  time: {
    fontSize: 13,
    color: '#444',
  },
  creator: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  noEvents: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});
