import { useState } from "react";
import { supabase } from "../helper/supabaseClient"; // Ensure Supabase client is imported
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { motion, AnimatePresence } from "framer-motion";

export default function Roadmap({ traceId }) { // Accept traceId as a prop
  const [nodes, setNodes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newHeading, setNewHeading] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [activeNode, setActiveNode] = useState(null);
  const [notes, setNotes] = useState("");
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [attachments, setAttachments] = useState("");
  const [activeAttachments, setActiveAttachments] = useState([]);

  // Opens the modal to add a new node.
  const addNode = () => {
    setShowModal(true);
  };

  // Saves a new node to the Supabase database
  const saveNode = async () => {
    if (!newHeading.trim() || !newDescription.trim()) {
      alert("Please enter both a node heading and description.");
      return;
    }

    if (!traceId) {
      alert("Trace ID is missing. Please save the trace first.");
      return;
    }

    const newNode = {
      trace_id: traceId, // Use the traceId passed as a prop
      heading: newHeading,
      description: newDescription,
      position: nodes.length + 1, // Set position as the next available position
      created_at: new Date().toISOString(),
    };

    try {
      // Insert the new node into the nodes table
      const { data, error } = await supabase
        .from("nodes") // Use the correct table name
        .insert([newNode])
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      // Update the local state with the saved node
      setNodes([...nodes, { ...data, id: data.node_id }]);
      setNewHeading("");
      setNewDescription("");
      setShowModal(false);
    } catch (error) {
      console.error("Error saving node:", error.message, error.details, error.hint);
      alert("An error occurred while saving the node. Please try again.");
    }
  };

  // Opens the notes modal for a given node.
  const openNotes = (node) => {
    setActiveNode(node);
    setNotes(node.notes);
    setShowNotesModal(true);
  };

  // Saves the edited notes back to the corresponding node.
  const saveNotes = () => {
    if (activeNode) {
      const updatedNodes = nodes.map((n) =>
        n.id === activeNode.id ? { ...n, notes } : n
      );
      setNodes(updatedNodes);
      setActiveNode(null);
    }
    setShowNotesModal(false);
  };

  // Opens the attachments modal for a given node
  const openAttachments = (node) => {
    setActiveNode(node);
    setActiveAttachments(node.attachments || []);
    setShowAttachmentsModal(true);
  };

  // Saves a new attachment link to the active node
  const saveAttachment = () => {
    if (!attachments.trim()) {
      alert("Please enter a valid link.");
      return;
    }

    const updatedNodes = nodes.map((n) =>
      n.id === activeNode.id
        ? { ...n, attachments: [...(n.attachments || []), attachments] }
        : n
    );

    setNodes(updatedNodes);
    setAttachments("");
    setActiveAttachments([...activeAttachments, attachments]);
    // Do NOT close the modal here
  };

  // Deletes an attachment link from the active node
  const deleteAttachment = (index) => {
    const updatedAttachments = activeAttachments.filter((_, i) => i !== index);
    const updatedNodes = nodes.map((n) =>
      n.id === activeNode.id
        ? { ...n, attachments: updatedAttachments }
        : n
    );
    setNodes(updatedNodes);
    setActiveAttachments(updatedAttachments);
  };

  // A simple vertical arrow component.
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
                  <Button
                    onClick={() => openNotes(node)}
                    className="bg-gray-700 hover:bg-gray-600 rounded-full px-5 py-1 text-xs font-medium shadow-md"
                  >
                    Notes
                  </Button>
                  <Button
                    onClick={() => openAttachments(node)}
                    className="bg-gray-700 hover:bg-gray-600 rounded-full px-5 py-1 text-xs font-medium shadow-md"
                  >
                    Attachments
                  </Button>
                </div>
                <CardContent className="p-4">
                  {/* The node notes are not displayed here */}
                </CardContent>
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
        <Button
          className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg shadow-lg"
          onClick={addNode}
        >
          Add Node
        </Button>
      </motion.div>

      {/* Modal for adding a new node */}
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
                placeholder="Node heading..."
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full border p-2 rounded mb-4 bg-gray-700 border-gray-600 text-white"
                placeholder="What is it about?"
              ></textarea>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveNode}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                >
                  Save
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal for editing notes */}
      <AnimatePresence>
        {showNotesModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          >
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-80 text-white border border-gray-700">
              <h2 className="text-lg font-semibold mb-2">Edit Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border p-2 rounded mb-4 bg-gray-700 border-gray-600 text-white"
                placeholder="Enter notes..."
              ></textarea>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setShowNotesModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveNotes}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                >
                  Save
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal for editing attachments */}
      <AnimatePresence>
        {showAttachmentsModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          >
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-80 text-white border border-gray-700">
              <h2 className="text-lg font-semibold mb-2">Add Attachments</h2>
              <input
                type="text"
                value={attachments}
                onChange={(e) => setAttachments(e.target.value)}
                className="w-full border p-2 rounded mb-4 bg-gray-700 border-gray-600 text-white"
                placeholder="Enter link..."
              />
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setShowAttachmentsModal(false)} // Save button closes the modal
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
                >
                  Save
                </Button>
                <Button
                  onClick={saveAttachment} // Add button saves the attachment but keeps the modal open
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                >
                  Add
                </Button>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">Attachments:</h3>
                <ul
                  className="list-disc list-inside text-gray-400 space-y-2 overflow-y-auto max-h-40" // Add scrollbar
                >
                  {activeAttachments.map((link, index) => {
                    const formattedLink =
                      link.startsWith("http://") || link.startsWith("https://")
                        ? link
                        : `https://${link}`;
                    return (
                      <li
                        key={index}
                        className="flex justify-between items-center bg-gray-700 p-2 rounded-lg"
                      >
                        <a
                          href={formattedLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline break-all"
                        >
                          {link}
                        </a>
                        <Button
                          onClick={() => deleteAttachment(index)}
                          className="bg-transparent hover:bg-red-700 p-1 rounded-full text-xs text-red-600 hover:text-white"
                          aria-label="Delete attachment"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
