import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TouchableWithoutFeedback,
    useWindowDimensions,
} from 'react-native';
import Colors from '@/constants/colors';
import { X } from 'lucide-react-native';
import { ProductVariant } from '@/types';

interface CuttingModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (variantName: string) => void;
    options?: string[];
    variants?: ProductVariant[]; // Add support for variants
    weight?: number; // Added to calculate total price for variant quantities
    title?: string;
}

const DEFAULT_CUTTING_TYPES = [
    'Curry Cut (Small)',
    'Curry Cut (Medium)',
    'Whole Bird',
    'Boneless Cubes',
    'Minced (Keema)',
];

export default function CuttingModal({ visible, onClose, onSelect, options, variants, weight = 1, title }: CuttingModalProps) {
    const { width: windowWidth } = useWindowDimensions();
    const isLargeScreen = windowWidth >= 768;

    // If variants are provided, use them. Otherwise rely on options or default.

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={[styles.overlay, isLargeScreen && styles.largeOverlay]}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.modalContent, isLargeScreen && styles.largeModalContent]}>
                            <View style={styles.header}>
                                <Text style={styles.title}>{title || 'Select Cutting Type'}</Text>
                                <TouchableOpacity onPress={onClose}>
                                    <X size={24} color={Colors.charcoal} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.optionsContainer}>
                                {variants ? (
                                    variants.map((variant) => {
                                        return (
                                        <TouchableOpacity
                                            key={variant.name}
                                            style={styles.optionButton}
                                            onPress={() => onSelect(variant.name)}
                                        >
                                            <View style={styles.optionRow}>
                                                <Text style={styles.optionText}>{variant.name}</Text>
                                                <Text style={styles.optionPrice}>₹{(variant.price).toFixed(2)}/PC</Text>
                                            </View>
                                        </TouchableOpacity>
                                        );
                                    })
                                ) : (
                                    (options && options.length > 0 ? options : DEFAULT_CUTTING_TYPES).map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            style={styles.optionButton}
                                            onPress={() => onSelect(type)}
                                        >
                                            <Text style={styles.optionText}>{type}</Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    largeOverlay: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    largeModalContent: {
        width: 500,
        borderRadius: 24,
        paddingBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.charcoal,
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        padding: 16,
        backgroundColor: Colors.creamLight,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.cream,
    },
    optionText: {
        fontSize: 16,
        color: Colors.charcoal,
        fontWeight: '500',
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.charcoal,
    },
});
