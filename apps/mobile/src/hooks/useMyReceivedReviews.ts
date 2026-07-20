import { useEffect, useState } from 'react';
import { getMyReceivedReviews, AnonymousReview } from '../services/reviewService';

// 내가 받은 리뷰 전체 집계 (마이페이지 "리뷰 확인"). 리뷰어 정보는 포함되지 않는다(익명 정책)
export function useMyReceivedReviews(myUserId: number | null) {
  const [reviews, setReviews] = useState<AnonymousReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (myUserId == null) return;
    let cancelled = false;
    getMyReceivedReviews()
      .then((data) => {
        if (cancelled) return;
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
      })
      .catch((e) => console.error('[useMyReceivedReviews] 리뷰 로드 실패:', e))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [myUserId]);

  return { reviews, averageRating, isLoading };
}
