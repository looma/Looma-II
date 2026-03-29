#!/bin/bash

# Start the Piper server for the English (Amy) voice on port 5001
# The '&' runs the process in the background
python3 -m piper.http_server --model /app/voices/en_US-amy-medium/model.onnx --port 5001 &
echo "Started Piper server for en_US-amy-medium on port 5001."

# Start the Piper server for the Nepali (Google) voice on port 5002
# The '&' runs the process in the background
python3 -m piper.http_server --model /app/voices/ne_NP-google-medium/model.onnx --port 5002 &
echo "Started Piper server for ne_NP-google-medium on port 5002."

# The 'wait' command is crucial. It waits for all background jobs
# to finish, which prevents the container from exiting immediately.
wait
