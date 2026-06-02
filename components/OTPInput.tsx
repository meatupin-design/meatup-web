import React, { useRef, useState } from 'react';
import { StyleSheet, View, TextInput, NativeEventEmitter } from 'react-native';
import Colors from '@/constants/colors';

interface OTPInputProps {
  length: number;
  onComplete: (otp: string) => void;
  isLoading?: boolean;
}

export default function OTPInput({ length, onComplete, isLoading }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<TextInput[]>([]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text.length !== 0 && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === length) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {otp.map((digit, index) => (
        <TextInput
          key={index}
          style={[styles.input, digit ? styles.inputFilled : null]}
          keyboardType="numeric"
          maxLength={1}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          ref={(ref) => {
            if (ref) inputRefs.current[index] = ref;
          }}
          editable={!isLoading}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginVertical: 20,
  },
  input: {
    width: 45,
    height: 55,
    backgroundColor: Colors.creamLight,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.charcoal,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputFilled: {
    borderColor: Colors.orange,
    backgroundColor: Colors.white,
  },
});
