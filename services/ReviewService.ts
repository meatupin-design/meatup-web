import { db } from '@/config/firebaseConfig';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    runTransaction, 
    orderBy,
    onSnapshot
} from 'firebase/firestore';
import { Review, Product } from '@/types';

export const ReviewService = {
    addReview: async (reviewData: Omit<Review, 'id'>) => {
        try {
            await runTransaction(db, async (transaction) => {
                const productRef = doc(db, 'products', reviewData.product_id);
                const productSnap = await transaction.get(productRef);

                if (!productSnap.exists()) {
                    throw new Error("Product does not exist!");
                }

                const product = productSnap.data() as Product;
                const oldRating = product.rating || 0;
                const oldCount = product.num_reviews || 0;

                const newCount = oldCount + 1;
                const newRating = ((oldRating * oldCount) + reviewData.rating) / newCount;

                // Create review doc
                const reviewRef = doc(collection(db, 'reviews'));
                
                transaction.set(reviewRef, {
                    ...reviewData,
                    created_at: Date.now()
                });

                transaction.update(productRef, {
                    rating: Number(newRating.toFixed(1)),
                    num_reviews: newCount
                });
            });
            return true;
        } catch (error) {
            console.error("Error adding review:", error);
            throw error;
        }
    },

    getProductReviews: async (productId: string): Promise<Review[]> => {
        try {
            const q = query(
                collection(db, 'reviews'),
                where("product_id", "==", productId),
                orderBy("created_at", "desc")
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        } catch (error) {
            console.error("Error fetching product reviews:", error);
            return [];
        }
    },

    subscribeToProductReviews: (productId: string, callback: (reviews: Review[]) => void) => {
        const q = query(
            collection(db, 'reviews'),
            where("product_id", "==", productId),
            orderBy("created_at", "desc")
        );
        return onSnapshot(q, (snapshot) => {
            const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
            callback(reviews);
        }, (error) => {
            console.error("Error subscribing to reviews:", error);
        });
    }
};
