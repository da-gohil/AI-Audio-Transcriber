import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const AudioUploader = () => {
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an audio file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setProgress(0);
      setTranscription("");
      setUploadDone(false);

      const response = await axios.post(
        "http://localhost:8080/api/transcribe",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (event) => {
            if (event.total) {
              const percent = Math.round((event.loaded * 100) / event.total);
              setProgress(percent);
            }
          },
        }
      );

      setTranscription(response.data);
      setUploadDone(true);
    } catch (error) {
      console.error("Error transcribing audio:", error);
      alert("Something went wrong while transcribing the audio.");
    } finally {
      setLoading(false);
    }
  };

  // Reset checkmark after it plays
  useEffect(() => {
    if (uploadDone) {
      const timer = setTimeout(() => setUploadDone(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [uploadDone]);

  return (
    <div className="container">
      <h1 className="title">Audio to Text Transcriber</h1>

      <div className="file-upload">
        <input
          type="file"
          accept="audio/*"
          id="audioFile"
          onChange={handleFileChange}
        />
        <label htmlFor="audioFile" className="upload-label">
          {file ? file.name : "Choose an audio file"}
        </label>
      </div>

      <button
        className="btn-upload"
        onClick={handleUpload}
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload & Transcribe"}
      </button>

      {/* Progress bar */}
      {loading && !uploadDone && (
        <div className="progress-container">
          <div
            className="progress-bar"
            style={{ width: `${progress}%` }}
          ></div>
          <p className="progress-text">{progress}%</p>
        </div>
      )}

      {/* Checkmark success animation */}
      {uploadDone && (
        <div className="checkmark-container">
          <div className="checkmark-circle">
            <div className="checkmark"></div>
          </div>
          <p className="checkmark-text">Upload Complete</p>
        </div>
      )}

      {/* Transcription result */}
      {transcription && !loading && (
        <div className="transcription fade-in slide-up">
          <h2 className="transcription-title">Transcription Result</h2>
          <p className="transcription-text">{transcription}</p>
        </div>
      )}
    </div>
  );
};

export default AudioUploader;
