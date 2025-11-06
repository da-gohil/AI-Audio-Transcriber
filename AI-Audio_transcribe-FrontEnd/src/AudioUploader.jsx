// src/AudioUploader.jsx - Consolidated and Simple Frontend

import React, { useState } from "react";
import axios from "axios";
import "./App.css"; 

const MAX_FILE_SIZE_MB = 25; 

// --- Main Audio Uploader Component (Simplified) ---
const AudioUploader = () => {
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState("Transcription Result will appear here...");
  const [loading, setLoading] = useState(false);
  
  // Supported formats list to match your backend error message
  const SUPPORTED_FORMATS = "audio/flac, audio/m4a, audio/mp3, audio/mp4, video/mp4, audio/mpeg, audio/mpga, audio/oga, audio/ogg, audio/wav, audio/webm";
  
  // --- File Handling (The core File Selector logic) ---
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
        // Basic file type and size validation
        if (!selectedFile.type.startsWith("audio/") && !selectedFile.type.startsWith("video/")) {
            alert("Please select a valid audio/video file supported by the API.");
            setFile(null);
            return;
        }
        if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          alert(`File size exceeds the maximum limit of ${MAX_FILE_SIZE_MB}MB.`);
          setFile(null);
          return;
        }
        
        setFile(selectedFile);
        setTranscription("Ready to transcribe: " + selectedFile.name);
    } else {
        setFile(null);
        setTranscription("Transcription Result will appear here...");
    }
  };

  // --- API / Transcribe Logic ---
  const handleTranscribe = async () => {
    if (!file) {
        alert("Please choose an audio file first.");
        return;
    }
    if (loading) return;

    const formData = new FormData();
    formData.append("file", file); // Ensure the key matches your Spring @RequestParam("file")

    try {
      setLoading(true);
      setTranscription("Uploading and Transcribing... Please wait.");
      
      const response = await axios.post(
        "http://localhost:8080/api/transcribe", // Targetting your running Spring server
        formData,
      );
      
      // Update the transcription result
      const resultText = response.data.transcript || 
                         (typeof response.data === 'string' ? response.data : "Transcription complete (No transcript field found).");

      setTranscription(resultText);
    } catch (error) {
      console.error("Error transcribing audio:", error);
      // Display the error to the user for better feedback
      const errorMsg = error.response?.data?.error?.message || error.message;
      setTranscription(`ERROR: Failed to transcribe audio. Details: ${errorMsg}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="simple-app-container">
        
        {/* Title */}
        <h1>Audio to Text Transcriber</h1>
        
        {/* The Frontend File Selector Component */}
        <div className="file-input-wrapper">
            {/* The actual HTML file input */}
            <input 
                type="file" 
                accept={SUPPORTED_FORMATS} 
                onChange={handleFileChange} 
                className="native-file-input"
            />
        </div>

        {/* Upload and Transcribe Button (Separate component as requested previously) */}
        <button
            onClick={handleTranscribe}
            disabled={loading || !file}
            className="transcribe-button-simple"
        >
            {loading ? "Processing..." : "Upload and Transcribe"}
        </button>

        {/* Displaying selected file name below the input */}
        {file && <p className="file-name-display">File selected: **{file.name}**</p>}


        {/* Transcription Result Title */}
        <h2 className="result-title-simple">Transcription Result</h2>

        {/* Transcription Result Box */}
        <div className="transcript-box-simple">
            <p>{transcription}</p>
            <small>Max file size: {MAX_FILE_SIZE_MB}MB</small>
        </div>
    </div>
  );
};

export default AudioUploader;