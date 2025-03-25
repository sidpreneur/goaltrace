import { useState } from "react";
import Roadmap from "./components/roadmap.jsx";
import Navbar from "./components/Navbar.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./components/ui/button";
import SavedTraceCard from "./components/SavedTraceCard.jsx";

export default function Newtrace() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("");
  const [showModal, setShowModal] = useState(true);
  const [saved, setSaved] = useState(false);

  const saveDetails = () => {
    if (!title.trim() || !description.trim() || !tag.trim()) {
      alert("Please fill in all fields before saving.");
      return;
    }
  
    // Split tags by spaces, filtering out empty values
    const tagArray = tag.split(" ").filter(t => t.trim().startsWith("#"));
  
    setSaved(true);
    setShowModal(false);
  };
  

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
       <div className="fixed top-0 left-0 right-0 z-50">
  <Navbar />
</div>

      <div className="fixed left-6 top-24 z-10">
      {saved && (
  <SavedTraceCard 
    title={title} 
    description={description} 
    tags={tag.split(" ").filter(t => t.trim().startsWith("#"))} 
  />
)}

</div>
<div className="min-h-screen flex flex-col justify-center items-center overflow-hidden pt-16">
  <Roadmap 
    title={saved ? title : ""} 
    description={saved ? description : ""} 
    tag={saved ? tag : ""} 
  />
</div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          >
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-80 text-white border border-gray-700">
              <h2 className="text-lg font-semibold mb-2">New Trace Details</h2>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border p-2 rounded mb-2 bg-gray-700 border-gray-600 text-white"
              />
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border p-2 rounded mb-2 bg-gray-700 border-gray-600 text-white"
              ></textarea>
              <input
                type="text"
                placeholder="Tag e.g. #food #travel"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full border p-2 rounded mb-2 bg-gray-700 border-gray-600 text-white"
              />
              <div className="flex justify-end gap-2">
                <Button onClick={() => setShowModal(false)} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg">Cancel</Button>
                <Button onClick={saveDetails} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg">Save</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}