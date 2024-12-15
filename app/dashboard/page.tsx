import { ProtectedRoute } from '@/components/ProtectedRoute';
import DashboardContent from '@/components/DashboardContent';

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
