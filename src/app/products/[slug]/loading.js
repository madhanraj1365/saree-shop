export default function Loading() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-10">
          {/* Sidebar Skeleton */}
          <div className="hidden lg:block space-y-10 animate-pulse">
            <div className="h-[400px] w-full bg-gray-100 rounded-lg"></div>
            <div className="h-[200px] w-full bg-gray-100 rounded-lg"></div>
          </div>

          {/* Main Content Skeleton */}
          <div className="flex flex-col animate-pulse">
            <div className="mb-6 h-10 w-40 bg-gray-100 rounded"></div>
            
            <div className="grid items-start gap-12 md:grid-cols-2">
              {/* Image Skeleton */}
              <div className="grid gap-6 sm:grid-cols-[80px_1fr] lg:grid-cols-[100px_1fr]">
                <div className="hidden flex-col gap-4 sm:flex">
                  <div className="h-24 w-full bg-gray-100 rounded"></div>
                  <div className="h-24 w-full bg-gray-100 rounded"></div>
                  <div className="h-24 w-full bg-gray-100 rounded"></div>
                </div>
                <div className="h-[500px] w-full bg-gray-100 rounded-xl"></div>
              </div>

              {/* Text Skeleton */}
              <div className="space-y-6">
                <div className="h-10 w-3/4 bg-gray-100 rounded"></div>
                <div className="h-8 w-1/3 bg-gray-100 rounded"></div>
                <div className="h-[1px] w-full bg-gray-100 my-8"></div>
                <div className="h-20 w-full bg-gray-100 rounded"></div>
                <div className="h-12 w-full bg-gray-100 rounded mt-6"></div>
                <div className="h-12 w-full bg-gray-100 rounded mt-4"></div>
                <div className="h-32 w-full bg-gray-100 rounded mt-8"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
