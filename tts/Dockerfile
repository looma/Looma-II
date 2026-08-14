# Use a slim Python image as the base
FROM python:3.9-slim-bullseye

# Set the working directory
WORKDIR /app

# Install necessary dependencies (like wget) and piper-tts
RUN apt-get update && \
    apt-get install -y wget ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    pip install piper-tts[http]==1.3.0

# --- Download Voice 1: en_US-amy-medium ---
RUN mkdir -p /app/voices/en_US-amy-medium
RUN wget 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx' -O /app/voices/en_US-amy-medium/model.onnx && \
    wget 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json' -O /app/voices/en_US-amy-medium/model.onnx.json

# --- Download Voice 2: ne_NP-google-medium ---
RUN mkdir -p /app/voices/ne_NP-google-medium
RUN wget 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ne/ne_NP/google/medium/ne_NP-google-medium.onnx' -O /app/voices/ne_NP-google-medium/model.onnx && \
    wget 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/ne/ne_NP/google/medium/ne_NP-google-medium.onnx.json' -O /app/voices/ne_NP-google-medium/model.onnx.json

# Copy the startup script into the container
COPY start.sh .

# Make the startup script executable
RUN chmod +x start.sh

# Expose both ports
EXPOSE 5001
EXPOSE 5002

# Set the command to run the startup script
CMD ["./start.sh"]
