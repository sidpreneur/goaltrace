import { useState } from "react";
import { supabase } from "../helper/supabaseClient"; // Ensure Supabase client is imported
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";

export default function Roadmap({ traceId }) { // Accept traceId as a prop
  const [nodes, setNodes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newHeading, setNewHeading] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [activeNode, setActiveNode] = useState(null);
  const [notes, setNotes] = useState("");
  const [showlinksModal, setShowlinksModal] = useState(false);
  const [links, setlinks] = useState("");
  const [activelinks, setActivelinks] = useState([]);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [deadline, setDeadline] = useState("");
  // States for attachments modal
const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
const [selectedFile, setSelectedFile] = useState(null);
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
      trace_id: traceId,
      heading: newHeading,
      description: newDescription,
      position: nodes.length + 1,
      created_at: new Date().toISOString(),
      status: "red"  // default status is red
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

      // If a deadline was set, save it to the deadlines table
      if (newDeadline) {
        const deadlineData = {
          node_id: data.node_id,
          deadline: newDeadline,
          created_at: new Date().toISOString()
        };

        const { error: deadlineError } = await supabase
          .from("deadlines")
          .insert([deadlineData]);

        if (deadlineError) {
          console.error("Error saving deadline:", deadlineError);
          // Continue anyway as the node was saved successfully
        }
      }

      // Update the local state with the saved node and its deadline
      setNodes([...nodes, { 
        ...data, 
        id: data.node_id,
        deadline: newDeadline 
      }]);
      
      // Reset form fields
      setNewHeading("");
      setNewDescription("");
      setNewDeadline("");
      setShowModal(false);
    } catch (error) {
      console.error("Error saving node:", error.message, error.details, error.hint);
      alert("An error occurred while saving the node. Please try again.");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "red":
        return "bg-red-500 border-red-600 border-2";
      case "yellow":
        return "bg-yellow-500 border-yellow-600 border-2";
      case "green":
        return "bg-green-500 border-green-600 border-2";
      default:
        return "bg-red-500 border-red-600 border-2";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "green":
        return "Done";
      case "yellow":
        return "In Progress";
      case "red":
        return "Not Started";
      default:
        return "Not Started";
    }
  };
  
  const statuses = ["red", "yellow", "green"];

  const toggleStatus = async (node) => {
    // Get the current status (default to red if undefined)
    const currentStatus = node.status || "red";
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    try {
      // Update the node's status in Supabase.
      const { error } = await supabase
        .from("nodes")
        .update({ status: nextStatus })
        .eq("node_id", node.id);  // Make sure this matches your schema

      if (error) throw error;

      // Update local state to reflect the new status.
      const updatedNodes = nodes.map((n) =>
        n.id === node.id ? { ...n, status: nextStatus } : n
      );
      setNodes(updatedNodes);
    } catch (error) {
      console.error("Error updating status:", error.message);
      alert("Failed to update status");
    }
  };

  // Opens the deadline modal for a given node
  const openDeadline = async (node) => {
    try {
      // Fetch the current deadline for this node
      const { data: deadlineData, error } = await supabase
        .from("deadlines")
        .select("deadline")
        .eq("node_id", node.node_id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching deadline:", error);
      }

      // Set the deadline in state (empty string if none exists)
      setDeadline(deadlineData?.deadline || "");
      setActiveNode(node);
      setShowDeadlineModal(true);
    } catch (error) {
      console.error("Unexpected error in openDeadline:", error);
      setDeadline("");
      setActiveNode(node);
      setShowDeadlineModal(true);
    }
  };

  // Saves the deadline for the active node
  const saveDeadline = async () => {
    if (!activeNode) {
      alert("No active node selected.");
      return;
    }
  
    try {
      // Check for existing deadline using node_id
      const { data: existingDeadline, error: checkError } = await supabase
        .from("deadlines")
        .select("deadline")
        .eq("node_id", activeNode.node_id)
        .maybeSingle();
  
      if (checkError) throw checkError;
  
      if (existingDeadline) {
        // Update existing deadline time
        const { error: updateError } = await supabase
          .from("deadlines")
          .update({ 
            deadline: deadline, // Optional: track update time
          })
          .eq("node_id", activeNode.node_id);
  
        if (updateError) throw updateError;
      } else {
        // Insert new deadline (as before)
        const { error: insertError } = await supabase
          .from("deadlines")
          .insert([{
            node_id: activeNode.node_id,
            deadline: deadline,
            created_at: new Date().toISOString()
          }]);
  
        if (insertError) throw insertError;
      }
  
      // Update local state
      const updatedNodes = nodes.map(n => 
        n.id === activeNode.id ? { ...n, deadline: deadline } : n
      );
      
      setNodes(updatedNodes);
      setActiveNode(null);
      setShowDeadlineModal(false);
      
    } catch (error) {
      console.error("Deadline operation failed:", error.message);
      alert(`Error: ${error.message}`);
    }
  };
  // Opens the notes modal for a given node.
  const openNotes = async (node) => {
    try {
      const { data: existingNote, error } = await supabase
        .from("notes")
        .select("notes_id, content")
        .eq("node_id", node.node_id)  // Make sure this matches your node identifier
        .maybeSingle();
  
      if (error) {
        console.error("Error fetching note:", error);
      }
  
      if (existingNote) {
        console.log("Fetched note:", existingNote);  // For debugging
        setNotes(existingNote.content || "");
        setActiveNode({ ...node, notes_id: existingNote.notes_id });
      } else {
        setNotes("");
        setActiveNode(node);
      }
  
      setShowNotesModal(true);
    } catch (error) {
      console.error("Unexpected error in openNotes:", error);
      setNotes("");
      setActiveNode(node);
      setShowNotesModal(true);
    }
  };
  
  // Saves the edited notes back to the corresponding node.
  const saveNotes = async () => {
    if (!activeNode) {
      alert("No active node selected.");
      return;
    }
  
    try {
      let updatedNodes;
  
      // If we already have a notes_id, do an UPDATE
      if (activeNode.notes_id) {
        const { error } = await supabase
          .from("notes")
          .update({
            content: notes,
            created_at: new Date().toISOString(),
          })
          .eq("notes_id", activeNode.notes_id);
  
        if (error) throw error;
  
        // Update the node's content in local state
        updatedNodes = nodes.map((n) =>
          n.id === activeNode.id ? { ...n, notes } : n
        );
      } else {
        // No notes_id => we INSERT a new row
        const { data, error } = await supabase
          .from("notes")
          .insert([
            {
              node_id: activeNode.id,
              content: notes,
              created_at: new Date().toISOString(),
            },
          ])
          .select("notes_id")
          .single();
  
        if (error) throw error;
  
        // Now we have a notes_id, store it in the node so we can update next time
        updatedNodes = nodes.map((n) =>
          n.id === activeNode.id
            ? { ...n, notes_id: data.notes_id, notes }
            : n
        );
      }
  
      // Update state and close the modal
      setNodes(updatedNodes);
      setActiveNode(null);
      setShowNotesModal(false);
    } catch (error) {
      console.error("Error saving notes:", error.message, error.details, error.hint);
      alert("An error occurred while saving the notes. Please try again.");
    }
  };
  
  // Opens the links modal and fetches existing links from the database.
  const openlinks = async (node) => {
    try {
      // Fetch all links for the given node
      const { data: existinglinks, error } = await supabase
        .from("links")
        .select("links_id, file_url")
        .eq("node_id", node.node_id) // assuming node.id is your node identifier
        .order("uploaded_at", { ascending: true });

      if (error) {
        console.error("Error fetching links:", error);
        setActivelinks([]);
      } else {
        // Set the fetched links in state.
        setActivelinks(existinglinks);
      }
      // Set the active node and show the modal.
      setActiveNode(node);
      setShowlinksModal(true);
    } catch (error) {
      console.error("Unexpected error fetching links:", error);
      setActivelinks([]);
      setActiveNode(node);
      setShowlinksModal(true);
    }
  };

  // Inserts a new links into the links table.
  const savelinks = async () => {
    if (!links.trim()) {
      alert("Please enter a valid link.");
      return;
    }
    try {
      // Insert a new links record for the active node
      const { data, error } = await supabase
        .from("links")
        .insert([
          {
            node_id: activeNode.node_id,
            file_url: links,
            uploaded_at: new Date().toISOString(),
          },
        ])
        .select("links_id, file_url")
        .single();

      if (error) {
        throw error;
      }

      // Update the activelinks state with the newly inserted record.
      setActivelinks([...activelinks, data]);
      // Clear the input field.
      setlinks("");
    } catch (error) {
      console.error("Error saving links:", error.message);
      alert("An error occurred while saving the links. Please try again.");
    }
  };

  // Deletes an links record from the links table.
  const deletelinks = async (index) => {
    try {
      const linksToDelete = activelinks[index];
      if (!linksToDelete) return;

      // Delete the links using its links_id
      const { error } = await supabase
        .from("links")
        .delete()
        .eq("links_id", linksToDelete.links_id);

      if (error) {
        throw error;
      }

      // Remove the deleted links from state
      const updatedlinks = activelinks.filter((_, i) => i !== index);
      setActivelinks(updatedlinks);
    } catch (error) {
      console.error("Error deleting links:", error.message);
      alert("An error occurred while deleting the links. Please try again.");
    }
  };

  // Helper function to format the deadline for display
  const formatDeadline = (deadlineString) => {
    if (!deadlineString) return "";
    
    try {
      const date = new Date(deadlineString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return deadlineString;
    }
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

 // Fetches all attachments for the active node from the attachments table.
const fetchAttachments = async () => {
  if (!activeNode?.node_id) return;

  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('node_id', activeNode.node_id);

  if (error) {
    console.error("Fetch attachments error:", error);
    return;
  }

  setActiveAttachments(data);
};

const fileInputRef = useRef(null);

// Trigger the file dialog if no file is selected.
const handleUploadAttachment = async (e) => {
  e.preventDefault();

  // ✅ Check if user is authenticated
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    console.error("User not authenticated:", authError);
    alert("You're not logged in. Please sign in to upload files.");
    return;
  }

  if (!selectedFile) {
    if (fileInputRef.current) fileInputRef.current.click();
    return;
  }

  if (!activeNode?.node_id) {
    alert("Active node is not set.");
    return;
  }

  const uniqueFileName = `${Date.now()}-${selectedFile.name}`;
  const filePath = `${activeNode.node_id}/${uniqueFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments-bucket")
    .upload(filePath, selectedFile, { upsert: true });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    alert("File upload failed.");
    return;
  }

  const { data: publicUrlData, error: urlError } = supabase
    .storage
    .from("attachments-bucket")
    .getPublicUrl(filePath);

  if (urlError || !publicUrlData?.publicUrl) {
    console.error("URL generation error:", urlError);
    alert("Failed to retrieve file URL.");
    return;
  }

  const { error: insertError } = await supabase
    .from("attachments")
    .insert([
      {
        attachment_id: crypto.randomUUID(),
        node_id: activeNode.node_id,
        file_name: filePath,
        file_url: publicUrlData.publicUrl,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        uploaded_at: new Date().toISOString()
      }
    ]);

  if (insertError) {
    console.error("DB insert error:", insertError);
    alert("Failed to save file metadata.");
    return;
  }

  console.log("Record inserted into attachments table successfully!");
  fetchAttachments();
  setSelectedFile(null);
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    console.log("Selected File:", file);
    setSelectedFile(file);
  }
};


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
            className="flex flex-col items-center w-full relative"  // note: relative for absolute children
          >
            <Card className="w-80 bg-gray-800 text-white shadow-lg border border-gray-700 rounded-xl p-4 relative">
              {/* 3D status button in top left */}
              <div className="group relative">
                <button
                  onClick={() => toggleStatus(node)}
                  className={`absolute top-0 left-0 w-6 h-6 rounded-full 
                    ${getStatusStyle(node.status)} 
                    transform hover:scale-110 active:scale-95
                    transition-all duration-150
                    shadow-md hover:shadow-lg
                    flex items-center justify-center
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400`}
                  aria-label={`Update status: ${getStatusText(node.status)}`}
                  style={{
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.3)'
                  }}
                >
                  <span className="sr-only">Status: {getStatusText(node.status)}</span>
                </button>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute left-10 top-0 z-10 px-2 py-1 text-xs text-white bg-gray-800 rounded pointer-events-none whitespace-nowrap">
                  {getStatusText(node.status)}
                </div>
              </div>

              {/* Deadline display in top right */}
              {node.deadline && (
                <div className="absolute top-2 right-2 flex items-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 text-gray-400 mr-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                    />
                  </svg>
                  <span className="text-xs text-gray-300">{formatDeadline(node.deadline)}</span>
                </div>
              )}

              <div className="border-b border-gray-600 text-center pb-3 mt-5">
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
                  onClick={() => openlinks(node)}
                  className="bg-gray-700 hover:bg-gray-600 rounded-full px-5 py-1 text-xs font-medium shadow-md"
                >
                  Links
                </Button>
                <Button
                  onClick={() => openDeadline(node)}
                  className="bg-gray-700 hover:bg-gray-600 rounded-full px-5 py-1 text-xs font-medium shadow-md"
                >
                  Deadline
                </Button>
                <Button
  onClick={() => {
    // Make sure you set the active node for which attachments will be loaded.
    // For example, if you want to use the same node for notes and attachments:
    setActiveNode(node);
    fetchAttachments(); // fetch attachments for the active node
    setShowAttachmentsModal(true);
  }}
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
              <div className="mb-4">
                <label className="block text-sm mb-1">Deadline (optional):</label>
                <input
                  type="datetime-local"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full border p-2 rounded bg-gray-700 border-gray-600 text-white"
                />
              </div>
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

      {/* Modal for editing deadline */}
      <AnimatePresence>
        {showDeadlineModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          >
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-80 text-white border border-gray-700">
              <h2 className="text-lg font-semibold mb-2">Edit Deadline</h2>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full border p-2 rounded mb-4 bg-gray-700 border-gray-600 text-white"
              />

              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setShowDeadlineModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveDeadline}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                >
                  Save
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal for editing links */}
      <AnimatePresence>
        {showlinksModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          >
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-80 text-white border border-gray-700 relative">
              {/* Cross Button */}
              <button
                onClick={() => setShowlinksModal(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-white focus:outline-none"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
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
              </button>

              <h2 className="text-lg font-semibold mb-2">Add links</h2>
              <input
                type="text"
                value={links}
                onChange={(e) => setlinks(e.target.value)}
                className="w-full border p-2 rounded mb-4 bg-gray-700 border-gray-600 text-white"
                placeholder="Enter link..."
              />
              <div className="flex justify-end gap-2">
                <Button
                  onClick={savelinks} // Add button saves the links but keeps the modal open
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                >
                  Add
                </Button>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">links:</h3>
                <ul className="list-disc list-inside text-gray-400 space-y-2 overflow-y-auto max-h-40">
                  {activelinks.map((links, index) => {
                    const formattedLink =
                      links.file_url.startsWith("http://") || links.file_url.startsWith("https://")
                        ? links.file_url
                        : `https://${links.file_url}`;
                    return (
                      <li key={links.links_id} className="flex justify-between items-center bg-gray-700 p-2 rounded-lg">
                        <a
                          href={formattedLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline break-all"
                        >
                          {links.file_url}
                        </a>
                        <Button
                          onClick={() => deletelinks(index)}
                          className="bg-transparent hover:bg-red-700 p-1 rounded-full text-xs text-red-600 hover:text-white"
                          aria-label="Delete links"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
      <AnimatePresence>
  {showAttachmentsModal && (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    >
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-80 text-white border border-gray-700 relative">
        {/* Close Button */}
        <button
          onClick={() => setShowAttachmentsModal(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-white focus:outline-none"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-lg font-semibold mb-4">Upload Attachment</h2>

        {/* Hidden file input triggered by the button */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* 👇 Show file name if selected */}
        {selectedFile && (
          <p className="text-sm text-green-400 mb-2 break-all">
            Selected: {selectedFile.name}
          </p>
        )}

        {/* 👇 Trigger file picker manually */}
        <div className="flex justify-end gap-2 mb-4">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
          >
            Choose File
          </Button>

          <Button
            onClick={handleUploadAttachment}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            Upload
          </Button>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-2">Uploaded Files:</h3>
          <ul className="space-y-2 max-h-40 overflow-y-auto text-gray-300 text-sm">
            {activeAttachments.map((att) => (
              <li key={att.attachment_id} className="bg-gray-700 p-2 rounded flex justify-between items-center">
                <a
                  href={getPublicUrl(att)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline break-all"
                >
                  {att.file_name.split('/').pop()}
                </a>
                <Button
                  onClick={() => deleteAttachment(att.attachment_id)}
                  className="bg-transparent text-red-500 hover:text-white p-1"
                  aria-label="Delete attachment"
                >
                  ✕
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>

    </div>
  );
}