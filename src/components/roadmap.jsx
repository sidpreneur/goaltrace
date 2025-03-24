import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { motion, AnimatePresence } from "framer-motion";

export default function Roadmap() {
  const [nodes, setNodes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newHeading, setNewHeading] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const addNode = () => {
    setShowModal(true);
  };

  const saveNode = () => {
    if (!newHeading.trim() || !newDescription.trim()) return;
    const newNode = { id: nodes.length + 1, heading: newHeading, description: newDescription };
    setNodes([...nodes, newNode]);
    setNewHeading("");
    setNewDescription("");
    setShowModal(false);
  };

  const VerticalArrow = () => (
    <motion.div 
      className="flex justify-center py-6 text-gray-500"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-5-5l5 5 5-5" />
      </svg>
    </motion.div>
  );

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white p-6">
      <AnimatePresence>
        {nodes.map((node, nodeIndex) => {
          const isLastNode = nodeIndex === nodes.length - 1;
          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col items-center w-full"
            >
              <Card className="w-80 bg-gray-800 text-white shadow-lg border border-gray-700 rounded-xl p-4 relative">
                <div className="border-b border-gray-600 text-center pb-3">
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                    {node.heading}
                  </h3>
                  <p className="text-gray-400 text-sm mt-2 italic">{node.description}</p>
                </div>
                <div className="flex justify-center gap-2 p-3">
                  <Button className="bg-gray-700 hover:bg-gray-600 rounded-full px-5 py-1 text-xs font-medium shadow-md">Notes</Button>
                  <Button className="bg-gray-700 hover:bg-gray-600 rounded-full px-5 py-1 text-xs font-medium shadow-md">Links</Button>
                </div>
                <CardContent className="p-4"></CardContent>
              </Card>
              {!isLastNode && <VerticalArrow />}
            </motion.div>
          );
        })}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mt-6"
      >
        <Button className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg shadow-lg" onClick={addNode}>Add Node</Button>
      </motion.div>

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
              <h2 className="text-lg font-semibold mb-2">Enter Node Details</h2>
              <input
                type="text"
                value={newHeading}
                onChange={(e) => setNewHeading(e.target.value)}
                className="w-full border p-2 rounded mb-4 bg-gray-700 border-gray-600 text-white"
                placeholder="Node title..."
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full border p-2 rounded mb-4 bg-gray-700 border-gray-600 text-white"
                placeholder="What is it about?"
              ></textarea>
              <div className="flex justify-end gap-2">
                <Button onClick={() => setShowModal(false)} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg">Cancel</Button>
                <Button onClick={saveNode} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg">Save</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
