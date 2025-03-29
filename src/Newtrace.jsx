import { useState } from "react";
import Roadmap from "./components/roadmap.jsx";
import Navbar from "./components/Navbar.jsx";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./components/ui/button";
import SavedTraceCard from "./components/SavedTraceCard.jsx";
import { supabase } from "./helper/supabaseClient";
import { useAuth } from "./context/AuthContext";

export default function Newtrace() {
  const { user } = useAuth(); // Get the logged-in user
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("");
  const [showModal, setShowModal] = useState(true);
  const [saved, setSaved] = useState(false);
  const [traceId, setTraceId] = useState(null); // Store trace_id

  const saveDetails = async () => {
    if (!title.trim() || !tag.trim()) {
      alert("Please fill in all fields before saving.");
      return;
    }

    // Split tags by spaces, filtering out empty values
    const tagArray = tag.split(" ").filter((t) => t.trim().startsWith("#"));

    try {
      // Step 1: Insert the trace into the `traces` table
      const { data: traceData, error: traceError } = await supabase
        .from("traces")
        .insert([{ user_id: user.id, title }])
        .select("trace_id")
        .single();

      if (traceError) {
        console.error("Error inserting trace:", traceError);
        alert("Failed to save trace.");
        return;
      }

      const traceId = traceData.trace_id;
      setTraceId(traceId); // Save the trace_id in state

      // Step 2: Insert tags into the `tags` table (if they don't exist)
      const tagInsertPromises = tagArray.map(async (tagName) => {
        const { data: tagData, error: tagError } = await supabase
          .from("tags")
          .upsert({ name: tagName }, { onConflict: "name" })
          .select("tag_id")
          .single();

        if (tagError) {
          console.error("Error inserting tag:", tagError);
          throw new Error("Failed to save tags.");
        }

        return tagData.tag_id;
      });

      const tagIds = await Promise.all(tagInsertPromises);

      // Step 3: Insert associations into the `trace_tags` table
      const traceTagInsertPromises = tagIds.map((tagId) => {
        return supabase.from("trace_tags").insert([{ trace_id: traceId, tag_id: tagId }]);
      });

      await Promise.all(traceTagInsertPromises);

      // Success: Update UI state
      setSaved(true);
      setShowModal(false);
      alert("Trace saved successfully!");
    } catch (error) {
      console.error("Error saving trace and tags:", error);
      alert("An error occurred while saving the trace.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Navbar */}
      <div className="md:fixed md:top-0 md:left-0 md:right-0 z-50">
        <Navbar />
      </div>

      {/* Saved Trace Card */}
      {/* For md and larger screens */}
      <div className="hidden md:block md:fixed md:left-6 md:top-24 z-10">
        {saved && (
          <SavedTraceCard
            title={title}
            tags={tag.split(" ").filter((t) => t.trim().startsWith("#"))}
          />
        )}
      </div>
      {/* For mobile/tablet: center the card */}
      <div className="block md:hidden mt-16 flex justify-center px-4">
        {saved && (
          <SavedTraceCard
            title={title}
            tags={tag.split(" ").filter((t) => t.trim().startsWith("#"))}
          />
        )}
      </div>

      {/* Roadmap */}
      <div className="min-h-screen flex flex-col justify-center items-center overflow-hidden pt-16 md:pt-24">
        <Roadmap traceId={traceId} />
      </div>

      {/* Modal for new trace details */}
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
              <input
                type="text"
                placeholder="Tag e.g. #food #travel"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full border p-2 rounded mb-2 bg-gray-700 border-gray-600 text-white"
              />
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveDetails}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                >
                  Save
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
