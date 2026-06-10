import DashboardLayout from '@/components/dashboard/DashboardLayout'

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`}/>
}

export default function DashboardLoading() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2"/>
            <Skeleton className="h-4 w-64"/>
          </div>
          <Skeleton className="h-10 w-36"/>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <Skeleton className="h-3 w-24 mb-3"/>
              <Skeleton className="h-8 w-32 mb-2"/>
              <Skeleton className="h-3 w-20"/>
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <Skeleton className="h-5 w-32 mb-5"/>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-3 w-24"/>
                    <Skeleton className="h-3 w-16"/>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
