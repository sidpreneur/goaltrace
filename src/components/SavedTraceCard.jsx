import React from 'react';
import { Layers, Tag, BookOpen } from 'lucide-react';

const SavedTraceCard = ({ title, description, tags }) => {
    return (
      <div className="bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-700 w-auto inline-block self-start">
        <div className="flex items-center mb-3">
          <Layers className="text-blue-400 mr-3" size={24} />
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        <div className="flex items-center mb-2">
          <Tag className="text-purple-400 mr-3" size={20} />
          <h3 className="text-white font-semibold">Tags:</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span key={index} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
};

export default SavedTraceCard;
