PROJECT_ID="$(gcloud config get-value project -q)"
docker build -t gcr.io/${PROJECT_ID}/grca-bot-v2:latest .
docker push gcr.io/${PROJECT_ID}/grca-bot-v2:latest
