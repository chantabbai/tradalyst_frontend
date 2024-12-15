import { ProtectedRoute } from '@/components/ProtectedRoute';
import JournalContent from '@/components/JournalContent';

export default function Journal() {
  return (
    <ProtectedRoute>
      <JournalContent />
    </ProtectedRoute>
  );
}
