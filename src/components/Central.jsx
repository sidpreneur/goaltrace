export default function Central() {
    return (
      <div className="flex flex-col items-center justify-center text-center h-screen">
        <h1 className="text-7xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent animate-gradient">
          GoalTrace
        </h1>
        <p className="text-xl text-gray-300 mt-4">Map Your Journey, One Trace at a Time</p>
        <div className="mt-8 space-x-6">
          <button 
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700 shadow-lg"
          >
            New Trace
          </button>
          <button 
            className="bg-gray-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-gray-700 shadow-lg"
          >
            Existing Traces
          </button>
        </div>
      </div>
    );
  }