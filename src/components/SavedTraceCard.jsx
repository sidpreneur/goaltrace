import { BookOpen, Tag, Eye, EyeOff } from "lucide-react";

export default function SavedTraceCard({ title, tags, visibility }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-xl w-full max-w-xs hover:shadow-2xl transition-shadow duration-300">
      {/* Title Section */}
      <div className="flex items-center gap-2 mb-4">
        <div className="text-blue-400">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>

      {/* Visibility */}
      <div className="flex items-center gap-2 mb-3">
        {visibility === "public" ? (
          <Eye className="text-green-400 w-5 h-5" />
        ) : (
          <EyeOff className="text-yellow-400 w-5 h-5" />
        )}
        <span
          className={`text-sm font-bold ${
            visibility === "public" ? "text-green-400" : "text-yellow-400"
          }`}
        >
          {visibility}
        </span>
      </div>

      {/* Tags */}
      <div className="flex items-start gap-2">
        <Tag className="text-purple-400 w-5 h-5 mt-1" />
        <div className="flex flex-wrap gap-2">
          {tags.length > 0 ? (
            tags.map((tag, index) => (
              <span
                key={index}
                className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400 font-bold">No tags</span>
          )}
        </div>
      </div>
    </div>
  );
}