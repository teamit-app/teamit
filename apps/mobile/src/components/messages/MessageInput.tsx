import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Colors } from '../../constants/colors';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading = false }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSendMessage(text);
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="메시지를 입력하세요..."
        placeholderTextColor={Colors.grayLight}
        value={text}
        onChangeText={setText}
        multiline
        editable={!isLoading}
      />
      <TouchableOpacity
        style={[styles.sendButton, (!text.trim() || isLoading) && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!text.trim() || isLoading}
        activeOpacity={0.7}
      >
        <Text style={styles.sendButtonText}>전송</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    backgroundColor: Colors.white,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.dark,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.grayLight,
    opacity: 0.5,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
