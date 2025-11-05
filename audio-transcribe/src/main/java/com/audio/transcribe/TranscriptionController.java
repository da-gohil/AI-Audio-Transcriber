package com.audio.transcribe;

import org.springframework.ai.audio.transcription.AudioTranscriptionPrompt;
import org.springframework.ai.audio.transcription.AudioTranscriptionResponse;
import org.springframework.ai.openai.OpenAiAudioTranscriptionModel;
import org.springframework.ai.openai.OpenAiAudioTranscriptionOptions;
import org.springframework.ai.openai.api.OpenAiAudioApi;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping; // Used for handling file uploads (POST requests)
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;

/**
 * REST Controller responsible for handling audio transcription requests.
 * It uses the Spring AI library to communicate with the OpenAI Whisper model.
 */
@RestController
@RequestMapping("/api/transcribe") // Base URL for all endpoints in this controller
public class TranscriptionController {

    // This is the core component from Spring AI that talks to the OpenAI service.
    // By using dependency injection, this instance is pre-configured by application.properties.
    private final OpenAiAudioTranscriptionModel transcriptionModel;

    /**
     * Constructor for the TranscriptionController. Spring Boot automatically injects the
     * OpenAiAudioTranscriptionModel, configured using the properties in application.properties.
     *
     * @param transcriptionModel The auto-configured OpenAI transcription model.
     */
    // The previous manual initialization is removed to leverage Spring Boot auto-configuration.
    public TranscriptionController(OpenAiAudioTranscriptionModel transcriptionModel) {
        // The model is now automatically configured with 'whisper-1' and 'json'
        // based on the settings in your configuration file.
        this.transcriptionModel = transcriptionModel;
    }

    /**
     * Handles the file upload and orchestrates the audio transcription process.
     *
     * @param file The audio file sent by the client, captured as a MultipartFile.
     * @return A ResponseEntity containing the transcribed text (which will be JSON) and the HTTP status code (200 OK).
     * @throws IOException if there is an error handling the file (e.g., saving to disk).
     */
    @PostMapping
    public ResponseEntity<String> transcribeAudio(@RequestParam("file") MultipartFile file) throws IOException {

        // --- 1. File Handling: Save the incoming file to a temporary location ---
        File tempFile = File.createTempFile("audio", ".wav");
        file.transferTo(tempFile);

        // --- 2. Configure Transcription Options (OpenAI Whisper Model) ---
        // We only set options here that are NOT defined in application.properties or
        // are dynamic to this specific call (like language and temperature).
        OpenAiAudioTranscriptionOptions transcriptionOptions = OpenAiAudioTranscriptionOptions.builder()
                // Removed the hardcoded 'TEXT' response format.
                // This call now respects the 'response-format=json' setting from your config.
                .language("en") // Specify the language of the audio (helps with accuracy)
                .temperature(0f) // Set a low temperature for deterministic, accurate transcription
                .build();

        // --- 3. Prepare the Audio Resource for the AI Model ---
        // The AI framework expects the audio file to be wrapped in a Resource object.
        var audioFile = new FileSystemResource(tempFile);

        // --- 4. Create the Final Prompt and Call the Model ---
        // The prompt bundles the audio file and the configuration options.
        AudioTranscriptionPrompt transcriptionRequest = new AudioTranscriptionPrompt(audioFile, transcriptionOptions);

        // Execute the transcription call to the OpenAI API
        AudioTranscriptionResponse response = transcriptionModel.call(transcriptionRequest);

        // --- 5. Clean Up and Return Result ---
        tempFile.delete(); // CRITICAL: Delete the temporary file from the server's disk

        // Since the configuration sets response-format=json, the output will be a JSON string.
        // We return the raw string output to the client.
        return new ResponseEntity<>(response.getResult().getOutput(), HttpStatus.OK);

    }
}
