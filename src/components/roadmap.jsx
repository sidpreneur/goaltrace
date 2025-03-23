import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { motion, AnimatePresence } from "framer-motion";

export default function Roadmap() {
  const [nodes, setNodes] = useState([]); // Start with an empty list
  const [showModal, setShowModal] = useState(false);
  const [newHeading, setNewHeading] = useState("");

  const addNode = () => {
    setShowModal(true);
  };

  const saveNode = () => {
    if (!newHeading.trim()) return; // Prevent empty headings

    const newNode = { id: nodes.length + 1, heading: newHeading };
    setNodes([...nodes, newNode]);
    setNewHeading("");
    setShowModal(false);
  };

  // Reusable vertical arrow
  const VerticalArrow = () => (
    <div className="flex justify-center py-6">
      <svg
        className="w-6 h-6 text-gray-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-5-5l5 5 5-5" />
      </svg>
    </div>
  );

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-6">
      <div className="flex flex-col items-center">
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
                {/* Main Node Card with Header and Non-Functional Buttons */}
                <Card className="w-64 text-center shadow-lg">
                  <div className="p-4 border-b text-center">
                    <h3 className="text-lg font-semibold text-gray-700">
                      {node.heading}
                    </h3>
                  </div>
                  {/* Buttons below the heading */}
                  <div className="flex justify-center gap-2 p-2">
                    <Button>About</Button>
                    <Button>Notes</Button>
                    <Button>Links</Button>
                  </div>
                  <CardContent className="p-4"></CardContent>
                </Card>

                {!isLastNode && <VerticalArrow />}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add Node Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex gap-2 mt-4"
        >
          <Button onClick={addNode}>Add Node</Button>
        </motion.div>
      </div>

      {/* Modal for entering node heading */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          >
            <div className="bg-white p-6 rounded-lg shadow-lg w-80">
              <h2 className="text-lg font-semibold mb-2">Enter Node Heading</h2>
              <input
                type="text"
                value={newHeading}
                onChange={(e) => setNewHeading(e.target.value)}
                className="w-full border p-2 rounded mb-4"
                placeholder="Node title..."
              />
              <div className="flex justify-end gap-2">
                <Button onClick={() => setShowModal(false)} className="bg-gray-400">
                  Cancel
                </Button>
                <Button onClick={saveNode}>Save</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
