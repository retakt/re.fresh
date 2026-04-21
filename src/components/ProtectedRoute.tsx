import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles?: Array<"admin" | "editor" | "member">
}) {
  const location = useLocation()
  const { isAuthenticated, loading, role } = useAuth()

  if (loading) {
    return (
      <div className="space-y-3 pt-2">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded" />
        <div className="space-y-2 pt-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles && !allowedRoles.includes(role as "admin" | "editor" | "member")) {
    return <Navigate to="/account" replace />
  }

  return <>{children}</>
}
