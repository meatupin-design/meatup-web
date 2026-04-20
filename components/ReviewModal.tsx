import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Star, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { ReviewService } from '@/services/ReviewService';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  productId: string;
  userId: string;
  userName: string;
}

export default function ReviewModal({ visible, onClose, productId, userId, userName }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    if (!comment.trim()) {
      alert('Please add a comment');
      return;
    }

    setLoading(true);
    try {
      await ReviewService.addReview({
        product_id: productId,
        user_id: userId,
        user_name: userName,
        rating,
        comment: comment.trim(),
        created_at: Date.now(),
      });
      setRating(0);
      setComment('');
      onClose();
    } catch (error) {
      alert('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalContainer}
            >
              <View style={styles.content}>
                <View style={styles.header}>
                  <Text style={styles.title}>Rate this Product</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <X size={24} color={Colors.charcoal} />
                  </TouchableOpacity>
                </View>

                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={styles.starBtn}
                    >
                      <Star
                        size={40}
                        fill={star <= rating ? Colors.orange : 'transparent'}
                        color={star <= rating ? Colors.orange : '#CCC'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Share your experience with this product..."
                  multiline
                  numberOfLines={4}
                  value={comment}
                  onChangeText={setComment}
                  placeholderTextColor="#999"
                />

                <TouchableOpacity
                  style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.submitBtnText}>Submit Review</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 450,
    alignSelf: 'center',
  },
  content: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  closeBtn: {
    padding: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  starBtn: {
    padding: 5,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    color: Colors.charcoal,
    marginBottom: 24,
  },
  submitBtn: {
    backgroundColor: Colors.orange,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
